# Heartside fonts (Fraunces)

These are the fonts used for the mug v3 Teeinblue artwork and for the real-photo preview renders in `tools/realphoto/`.

| File | Teeinblue font name | Used for |
|---|---|---|
| HS-Fraunces-Text.ttf | HS-Fraunces-Text | Note lines on the drinker's face (70 in the 2700x1050 print file) |
| HS-Fraunces-Italic.ttf | HS-Fraunces-Italic | Signed line, in chestnut (96) |
| HS-Fraunces-SemiBold.ttf | HS-Fraunces-SemiBold | Names and headings |

`build_note_widths.py` writes HS-Fraunces-Text's widths and kerning into `shopify/assets/hs3.js`, which uses them to break the mug's lines evenly. Run it again if the mug's font changes; `--check` fails when the table is stale.

They are static instances of Fraunces, renamed with an HS prefix so Teeinblue and Pillow load the exact same files. Fraunces is licensed under the SIL Open Font License 1.1 (see `OFL.txt`); the license is also embedded in each file.
