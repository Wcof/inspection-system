# Triage labels

The `triage` skill moves issues through a state machine using these labels. They map 1:1 to GitHub labels of the same name.

| Role | Label | Meaning |
|---|---|---|
| needs evaluation | `needs-triage` | maintainer needs to evaluate |
| waiting on reporter | `needs-info` | waiting on reporter to clarify |
| AFK-ready | `ready-for-agent` | fully specified, an agent can pick it up with no human context |
| needs human | `ready-for-human` | needs human implementation |
| will not action | `wontfix` | will not be actioned |

Apply via `gh issue edit <number> --add-label "<label>"`.
