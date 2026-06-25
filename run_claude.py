import argparse
import os
import sys

import anthropic


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run Claude via the Anthropic Python SDK."
    )
    parser.add_argument(
        "prompt",
        nargs="*",
        help="The prompt to send to Claude. If omitted, a default prompt is used.",
    )
    parser.add_argument(
        "--model",
        default="claude-opus-4-8",
        help="The Anthropic model to use.",
    )
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print(
            "Error: Set ANTHROPIC_API_KEY first, then rerun.\n"
            "Example:\n"
            "  export ANTHROPIC_API_KEY='sk-...'",
            "  python3 run_claude.py 'Hello Claude'",
            sep="\n",
            file=sys.stderr,
        )
        return 1

    prompt = " ".join(args.prompt).strip()
    if not prompt:
        prompt = "Write a short summary of why Python is useful."

    client = anthropic.Client(api_key=api_key)
    response = client.messages.create(
        model=args.model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
    )

    text = "".join(block.text for block in response.content)
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
