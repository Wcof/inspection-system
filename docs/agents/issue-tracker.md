# Issue tracker

Issues live in this repo's GitHub Issues (remote: `Wcof/inspection-system`). Use the `gh` CLI.

PRs are **not** a request surface — `/triage` processes issues only, not external PRs.

## Creating issues

```bash
gh issue create --title "<title>" --body "<body>" [--label "<label>"]
```

## Reading issues

```bash
gh issue list --state open [--label "<label>"]
gh issue view <number>
```

## Applying labels

```bash
gh issue edit <number> --add-label "<label>" --remove-label "<label>"
```
