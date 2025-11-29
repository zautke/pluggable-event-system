#!/usr/bin/env python3
"""One-shot validation for plugin-architecture-dev. Deleted by the caller after run."""
import os, re, json, glob, sys, subprocess, tempfile, time

ROOT = "/Volumes/MACDEV/pluggable-event-system"
P = os.path.join(ROOT, "plugins/plugin-architecture-dev")
H = os.path.join(P, "hooks")
results = []

def check(name, ok, detail=""):
    results.append((bool(ok), name, detail))
    print(("PASS" if ok else "FAIL"), "-", name, (":: " + detail) if detail else "")

# 1) chmod +x the runtime hook scripts
for s in ["run-hook.cmd", "session-start", "prompt-enhance", "quality-gate"]:
    path = os.path.join(H, s)
    try:
        os.chmod(path, 0o755)
        check("chmod +x " + s, os.access(path, os.X_OK))
    except Exception as e:
        check("chmod +x " + s, False, str(e))

# 2) JSON validity
json_files = [
    ".claude-plugin/marketplace.json",
    "plugins/plugin-architecture-dev/.claude-plugin/plugin.json",
    "plugins/plugin-architecture-dev/hooks/hooks.json",
    "plugins/plugin-architecture-dev/references/phase-registry.json",
    "plugins/plugin-architecture-dev/references/capability-detection.md",  # skipped below (not json)
]
for rel in json_files[:-1]:
    f = os.path.join(ROOT, rel)
    try:
        json.load(open(f))
        check("json parses " + rel, True)
    except Exception as e:
        check("json parses " + rel, False, str(e))

# phase-registry: 7 phases, quality-gate terminal & non-skippable
try:
    reg = json.load(open(os.path.join(P, "references/phase-registry.json")))
    phases = reg.get("phases", reg if isinstance(reg, list) else [])
    ids = [p.get("id") for p in phases]
    check("registry has 7 phases", len(phases) == 7, "ids=" + ",".join(map(str, ids)))
    check("registry ends at quality-gate", ids[-1] == "quality-gate" if ids else False)
except Exception as e:
    check("registry structural", False, str(e))

# 3) Frontmatter: YAML parse (if PyYAML) + block-scalar regression check
try:
    import yaml
    have_yaml = True
except Exception:
    have_yaml = False
check("PyYAML available", have_yaml, "" if have_yaml else "using structural checks only")

def split_frontmatter(path):
    txt = open(path, encoding="utf-8").read()
    if not txt.startswith("---"):
        return None, "no leading ---"
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    if not m:
        return None, "unterminated frontmatter"
    return m.group(1), None

md_files = (sorted(glob.glob(os.path.join(P, "agents/*.md")))
            + sorted(glob.glob(os.path.join(P, "skills/*/SKILL.md")))
            + sorted(glob.glob(os.path.join(P, "commands/*.md"))))
check("component md count", len(md_files) == 26, "found=%d (9 agents+8 skills+9 cmds)" % len(md_files))

for f in md_files:
    rel = os.path.relpath(f, P)
    fm, err = split_frontmatter(f)
    if err:
        check("fm " + rel, False, err)
        continue
    # regression check: any <example> => description MUST be a block scalar
    if "<example>" in fm and not re.search(r"(?m)^description:\s*\|\s*$", fm):
        check("fm " + rel, False, "has <example> but description is not block-scalar '|'")
        continue
    # regression check: no column-0 example lines leaking into the mapping
    leak = re.search(r"(?m)^(Context|user|assistant|<runs|<Task|<commentary):?", fm)
    if leak:
        check("fm " + rel, False, "column-0 example line leaks: " + leak.group(0))
        continue
    if have_yaml:
        try:
            data = yaml.safe_load(fm)
            ok = isinstance(data, dict) and "description" in data
            if "/agents/" in f or "/skills/" in f or f.endswith("SKILL.md"):
                ok = ok and "name" in data
            check("fm " + rel, ok, "keys=" + ",".join(sorted(data.keys())) if isinstance(data, dict) else "not a mapping")
        except Exception as e:
            check("fm " + rel, False, ("yaml: " + str(e).replace("\n", " "))[:140])
    else:
        check("fm " + rel, "description:" in fm, "(structural)")

# 4) Hook behavior tests
def run_hook(script, stdin, env=None):
    e = dict(os.environ)
    e.pop("COPILOT_CLI", None); e.pop("CURSOR_PLUGIN_ROOT", None)
    if env:
        e.update(env)
    p = subprocess.run(["bash", os.path.join(H, script)], input=stdin,
                       capture_output=True, text=True, env=e, timeout=25)
    return p.returncode, p.stdout, p.stderr

# session-start
rc, out, err = run_hook("session-start", '{"hook_event_name":"SessionStart","source":"startup"}', {"CLAUDE_PLUGIN_ROOT": H})
check("session-start injects context", '"additionalContext"' in out and "sdlc-available" in out, "rc=%d err=%s" % (rc, err[:80]))
try:
    json.loads(out); check("session-start output valid JSON", True)
except Exception as e:
    check("session-start output valid JSON", False, str(e) + " out=" + out[:80])

# prompt-enhance positive (/sdlc)
rc, out, err = run_hook("prompt-enhance", '{"prompt":"/sdlc build a tiny CLI that reverses stdin","hook_event_name":"UserPromptSubmit"}', {"CLAUDE_PLUGIN_ROOT": H})
check("prompt-enhance routes /sdlc", '"additionalContext"' in out and "sdlc-router" in out, "rc=%d err=%s" % (rc, err[:80]))
try:
    json.loads(out); check("prompt-enhance(+) output valid JSON", True)
except Exception as e:
    check("prompt-enhance(+) output valid JSON", False, str(e) + " out=" + out[:80])

# prompt-enhance positive (intent verb)
rc, out, err = run_hook("prompt-enhance", '{"prompt":"build an end-to-end URL shortener service","hook_event_name":"UserPromptSubmit"}', {"CLAUDE_PLUGIN_ROOT": H})
check("prompt-enhance routes intent verb", '"additionalContext"' in out and "sdlc-router" in out, "rc=%d" % rc)

# prompt-enhance negative (ordinary chat)
rc, out, err = run_hook("prompt-enhance", '{"prompt":"what time is it in tokyo right now?","hook_event_name":"UserPromptSubmit"}', {"CLAUDE_PLUGIN_ROOT": H})
check("prompt-enhance ignores non-SDLC chat", out.strip() == "", "out=%r" % out[:60])

# prompt-enhance disable flag (per-project)
tmpd = tempfile.mkdtemp()
os.makedirs(os.path.join(tmpd, ".sdlc"))
open(os.path.join(tmpd, ".sdlc/metaprompt-off"), "w").write("")
rc, out, err = run_hook("prompt-enhance", '{"prompt":"/sdlc build something","hook_event_name":"UserPromptSubmit"}', {"CLAUDE_PLUGIN_ROOT": H, "CLAUDE_PROJECT_DIR": tmpd})
check("prompt-enhance respects project disable flag", out.strip() == "", "out=%r" % out[:60])

# quality-gate: temp project with an active run
tmp = tempfile.mkdtemp()
os.makedirs(os.path.join(tmp, ".sdlc"))
open(os.path.join(tmp, ".sdlc/active"), "w").write("testrun\n")

# (a) no evidence -> block, active preserved
rc, out, err = run_hook("quality-gate", '{"hook_event_name":"Stop","cwd":"%s"}' % tmp, {"CLAUDE_PROJECT_DIR": tmp})
check("gate blocks when no evidence", ('"decision"' in out and '"block"' in out), "out=%r" % out[:90])
check("gate keeps .sdlc/active on block", os.path.exists(os.path.join(tmp, ".sdlc/active")))
try:
    json.loads(out); check("gate block output valid JSON", True)
except Exception as e:
    check("gate block output valid JSON", False, str(e))

# (b) SubagentStop never blocks
rc, out, err = run_hook("quality-gate", '{"hook_event_name":"SubagentStop","cwd":"%s"}' % tmp, {"CLAUDE_PROJECT_DIR": tmp})
check("gate SubagentStop never blocks", out.strip() == "", "out=%r" % out[:60])

# (c) dormant when no active run
tmp2 = tempfile.mkdtemp()
rc, out, err = run_hook("quality-gate", '{"hook_event_name":"Stop","cwd":"%s"}' % tmp2, {"CLAUDE_PROJECT_DIR": tmp2})
check("gate dormant without .sdlc/active", out.strip() == "", "out=%r" % out[:60])

# (d) fresh passing evidence -> pass, clears active
evdir = os.path.join(tmp, ".sdlc/evidence"); os.makedirs(evdir)
ev = {"run": "testrun", "interface": "cli", "status": "pass", "as_user": True,
      "generated_at": "2026-07-03T00:00:00Z",
      "behaviors": [{"name": "reverses a line", "expected": "dcba", "actual": "dcba",
                     "pass": True, "artifacts": ["evidence/testrun/t.txt"]}]}
open(os.path.join(evdir, "testrun.json"), "w").write(json.dumps(ev))
time.sleep(0.05); os.utime(os.path.join(evdir, "testrun.json"), None)
rc, out, err = run_hook("quality-gate", '{"hook_event_name":"Stop","cwd":"%s"}' % tmp, {"CLAUDE_PROJECT_DIR": tmp})
check("gate passes on fresh passing evidence", out.strip() == "" and not os.path.exists(os.path.join(tmp, ".sdlc/active")),
      "out=%r active=%s" % (out[:60], os.path.exists(os.path.join(tmp, ".sdlc/active"))))

# (e) stale evidence -> block
open(os.path.join(tmp, ".sdlc/active"), "w").write("testrun\n")
srcf = os.path.join(tmp, "main.py"); open(srcf, "w").write("print(1)\n")
time.sleep(0.05); os.utime(srcf, None)  # source newer than evidence
rc, out, err = run_hook("quality-gate", '{"hook_event_name":"Stop","cwd":"%s"}' % tmp, {"CLAUDE_PROJECT_DIR": tmp})
check("gate blocks stale evidence", ('"block"' in out and "stale" in out.lower()), "out=%r" % out[:100])

# (f) failing evidence -> block
tmp3 = tempfile.mkdtemp(); os.makedirs(os.path.join(tmp3, ".sdlc/evidence"))
open(os.path.join(tmp3, ".sdlc/active"), "w").write("r2\n")
evf = dict(ev); evf["run"] = "r2"; evf["status"] = "fail"; evf["behaviors"][0]["pass"] = False
open(os.path.join(tmp3, ".sdlc/evidence/r2.json"), "w").write(json.dumps(evf))
time.sleep(0.05); os.utime(os.path.join(tmp3, ".sdlc/evidence/r2.json"), None)
rc, out, err = run_hook("quality-gate", '{"hook_event_name":"Stop","cwd":"%s"}' % tmp3, {"CLAUDE_PROJECT_DIR": tmp3})
check("gate blocks failing evidence", '"block"' in out, "out=%r" % out[:90])

# summary
fails = [r for r in results if not r[0]]
print("\n== SUMMARY == total=%d pass=%d fail=%d" % (len(results), len(results) - len(fails), len(fails)))
for ok, name, detail in fails:
    print("  FAIL:", name, "::", detail)
sys.exit(1 if fails else 0)
