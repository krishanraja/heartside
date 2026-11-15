Status: n8n reached 8,000 of its 10,000 monthly executions on 14 Nov, mostly from the four order workflows polling every 10 to 30 minutes. Until the 6 Dec reset they run slower: send and note every 4 h, printed card every 6 h, mark fulfilled every 12 h. Their alert windows are widened so each email still goes once. Buddy's admission cleanup runs every 3 h and its webhook is unchanged. Seven background Mindmake workflows are paused until 6 Dec.
Next: On 6 Dec, restore the hourly timers (a scheduled reminder is set), then make the order workflows event-driven (Shopify orders/paid, Printful package_shipped).
Changed: The order workflows run on slower timers to stay inside n8n's monthly execution cap (Krish, 15 Nov).
North Star check (2026-11-15): holds.
