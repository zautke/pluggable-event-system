# Incident Response Notes

The platform team handles production incidents with a short triage loop. The incident commander opens a timeline, assigns communications, and records every mitigation step.

Services emit OpenTelemetry spans with request identifiers. During an outage, the support lead links customer reports to trace identifiers and affected deploy revisions.

The recovery review must include the first alert, the highest user impact, the rollback decision, and follow-up work with owners.
