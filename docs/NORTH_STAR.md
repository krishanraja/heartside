# North Star

Status: Current
Owner: Krish Raja
Last verified: 2026-10-18

> By February 2027, Heartside is the gift US dog owners reach for first when they want something that sounds like their dog. $10,000 is an ordinary month, not a Christmas peak, and most orders come from people who saw someone else's.

Set by Krish on 18 October 2026. It is not reached yet. It is what every session in this repository works toward.

## The number

**Shopify net sales, trailing 4 weeks**: $50,000 by 22 February 2027, on a front-loaded weekly ladder. Checkpoints: 16 Nov 2026: $1,624; 14 Dec 2026: $5,612; 11 Jan 2027: $14,792; 8 Feb 2027: $34,080; 22 Feb 2027: $50,000. The deadline week holds February 2027, the month the North Star tests.

```yaml north-star-metric
metric: "Shopify net sales, trailing 4 weeks"
unit: USD
direction: up
target: 50000
deadline: 2027-02-22
ladder_shape: front-loaded
source: "Shopify Admin API, orders net of refunds"
status: active
ladder:
  - [2026-10-26, 250]
  - [2026-11-02, 658]
  - [2026-11-09, 1084]
  - [2026-11-16, 1624]
  - [2026-11-23, 2311]
  - [2026-11-30, 3178]
  - [2026-12-07, 4263]
  - [2026-12-14, 5612]
  - [2026-12-21, 7275]
  - [2026-12-28, 9312]
  - [2027-01-04, 11791]
  - [2027-01-11, 14792]
  - [2027-01-18, 18408]
  - [2027-01-25, 22744]
  - [2027-02-01, 27922]
  - [2027-02-08, 34080]
  - [2027-02-15, 41378]
  - [2027-02-22, 50000]
```

Urgency (U1 to U5) is worked out every week from where the number stands against that week's target, by [the harness contract](https://github.com/krishanraja/ai-harness/blob/main/contract/north-star-metric.md). Set by Krish on 23 October 2026.

## How to use it

- Read it before any work, every session.
- Before you start, say which part of it the task moves. If the task moves nothing toward it, say so first and let Krish decide.
- Prefer the work that moves it furthest, and close each session by noting what moved.
- Only Krish changes this file. Record his ruling in the commit body as `Ruling (Krish, YYYY-MM-DD): ...`.
- When it is reached, say so and ask Krish for the next one.
