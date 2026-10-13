# v3 phone prototype (approved 13 Oct 2026)

The clickable phone prototype of the "gifts from your dog" journey that Krish approved on 13 October 2026 (version 7 of the claude.ai Design canvas "Heartside: gifts from your dog", https://claude.ai/artifact/68cvd4wN9xLGFzkFJSughX).

- `Main.dc.html`: the whole journey in one file (home, chat with Biscuit, reveal, choose gifts, share card). Its script block holds every scripted line: Biscuit's reactions, the chip answers, the follow-ups, and the gift lines each answer writes (`homeQ`, `lineFor`, the step blocks). Use those words as written.
- `canvas.json`: the canvas index.

This is a reference for flow, layout and copy, written in the Design canvas format (`<x-dc>`, `DCLogic`), not production code. It opens only inside the claude.ai canvas. The example dog photo is an uploaded asset in the canvas and is not in this repo. The spec it implements is `docs/V3-GIFTS-FROM-YOUR-DOG.md`.
