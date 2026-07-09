# Plugin Contract Notes

Every plugin boundary exchanges events with typed payloads. Input ports accept request events, while output ports return a success or error result with a concrete payload.

The registry defines legal connections between output and input ports. A graph edge is valid only when both ports agree on the payload shape.

Provider plugins expose live services such as embedding APIs, language model APIs, and vector databases instead of hidden configuration.
