# Game Ad Hook Library

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

Use this library to rank 3-5 hooks for a specific game. Every hook needs a
scroll-stop frame that works in the first 0.5 seconds and a payoff by 3 seconds.

## Ranking Criteria

Prefer hooks that:

- Use real footage moments.
- Put one focal point in the center 80% safe zone.
- Show motion or imminent failure in frame 1.
- Use a mascot or expressive face when available.
- Fit the game's mood/dimension.
- Avoid misleading mechanics.

## Hook Patterns

### 1. Save the Creature

- Use when: the game has a cute mascot, pet, companion, or vulnerable avatar.
- Scroll-stop frame: mascot mid-fall, trapped, cornered, or inches from danger.
- Payoff: player action saves it by 2-3s.
- Risk: fails if mascot is not visually readable at thumbnail size.

### 2. Near-Fail Rescue

- Use when: footage includes a last-second move, low health, almost missed jump,
  or one tile from failure.
- Scroll-stop frame: obvious fail state about to happen.
- Payoff: perfect save or surprising recovery.
- Risk: needs genuine near-fail footage.

### 3. Wrong Choice Rage Bait

- Use when: puzzles, sorting, physics, trivia, or any clear "why would you do
  that?" choice exists.
- Scroll-stop frame: finger/selector hovering over the obviously wrong option.
- Payoff: consequence lands fast, then show correct path.
- Risk: can annoy if the wrong choice feels fake or too stupid.

### 4. Perfect Combo

- Use when: match, merge, rhythm, roguelike, runner, idle, or builder footage has
  satisfying cascades.
- Scroll-stop frame: chain reaction one move before payoff.
- Payoff: combo clears, score jumps, board explodes with feedback.
- Risk: too visually busy if crop is not tight.

### 5. Boss Wall

- Use when: midcore, RPG, shooter, strategy, roguelite, or action game has a large
  enemy or intimidating obstacle.
- Scroll-stop frame: tiny player versus oversized boss.
- Payoff: first dodge/hit/skill reveals mastery fantasy.
- Risk: must not imply a boss not actually in the game.

### 6. Cute Mascot Bait

- Use when: character design is stronger than mechanics.
- Scroll-stop frame: big eyes, direct reaction, mascot filling frame.
- Payoff: mascot performs the core mechanic or reacts to player action.
- Risk: over-indexes on cuteness if game mood is dark or hardcore.

### 7. Level 999 Flex

- Use when: progression, gear, upgrades, ranks, or mastery is central.
- Scroll-stop frame: high-level avatar/tool/stat with clear visual superiority.
- Payoff: demonstrate why the upgraded state feels powerful.
- Risk: misleading if level/state is not attainable.

### 8. Before / After Build

- Use when: builder, merge, decorating, tycoon, simulator, or renovation.
- Scroll-stop frame: ugly/messy starting state.
- Payoff: rapid transition to upgraded state by 3s.
- Risk: needs real before/after assets.

### 9. Impossible Choice

- Use when: narrative, dating, survival, management, or strategy has dilemma
  moments.
- Scroll-stop frame: two conflicting choices on screen with stakes visible.
- Payoff: select one and show immediate consequence.
- Risk: UI text must be readable on mobile.

### 10. One Finger Mastery

- Use when: controls are simple and tactile.
- Scroll-stop frame: finger poised over a single decisive tap/swipe.
- Payoff: one input triggers a clean mechanic result.
- Risk: generic if the mechanic is not visually unique.

### 11. Hidden Mechanic Reveal

- Use when: the game has a surprising meta mechanic, merge rule, combo system, or
  environmental interaction.
- Scroll-stop frame: ordinary board with one strange glowing/odd element.
- Payoff: reveal the hidden interaction.
- Risk: too abstract without captions.

### 12. Speedrun Clear

- Use when: skill-based action, rhythm, platformer, runner, puzzle.
- Scroll-stop frame: timer + motion blur + obstacle cluster.
- Payoff: flawless mini-clear by 3s.
- Risk: footage must be smooth and high FPS.

### 13. Social Challenge

- Use when: multiplayer, party, co-op, competitive, leaderboard.
- Scroll-stop frame: friend/leaderboard/rival about to beat player.
- Payoff: reversal, clutch move, or taunt.
- Risk: weak if social proof is absent from listing/footage.

### 14. Cozy Escape Portal

- Use when: farming, decorating, life sim, crafting, cozy puzzle.
- Scroll-stop frame: warm inviting environment with one tactile action beginning.
- Payoff: satisfying placement, harvest, decorate, or collect.
- Risk: lower raw shock; needs beautiful asset quality.

### 15. Dark Mystery Question

- Use when: detective, horror, narrative, hidden object.
- Scroll-stop frame: ominous clue or silhouette in center frame.
- Payoff: clue interaction opens mystery path.
- Risk: avoid overpromising horror intensity.

### 16. UI Clean Sweep

- Use when: HUD, score, buttons, or board state can be cleaned into a satisfying
  visual.
- Scroll-stop frame: cluttered board/UI one move before cleanup.
- Payoff: everything clears or reorganizes.
- Risk: screen text may be unreadable if compressed.

## Output Fields Per Hook

For each ranked hook, write:

- Hook name.
- Scroll-stop frame.
- Specific concept for this game.
- Why it fits.
- Payoff by second mark.
- Required assets.
- Risk.
