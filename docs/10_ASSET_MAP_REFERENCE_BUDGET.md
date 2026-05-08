# 10 — Asset Map and Reference Budget

## Why this matters

Modern AI media tools are multimodal. Users do not merely type prompts; they bring identity photos, wardrobe references, motion references, locations, audio, textures, logos, and style boards.

OpenMediaForge turns raw references into a production plan.

## Reference Budget

A Reference Budget defines how many assets of each type a target/provider/model should use.

Default profile:

```txt
Images: up to 9
Videos: up to 3
Audio: up to 3
Combined: up to 12 when relevant
```

These defaults are editable per Target Profile.

## Asset roles

### Image roles

- Lead identity
- Alternate face angle
- Wardrobe
- Location
- Palette / style board
- Prop / symbol
- Secondary character
- End frame
- Poster frame

### Video roles

- Camera motion reference
- Action/choreography reference
- Transition/editing reference
- Existing clip to extend
- Source footage

### Audio roles

- Song/rhythm reference
- Voice reference
- Ambience
- Sound-effect tone

## Priority

- High: must preserve / must appear
- Medium: should guide
- Low: optional flavor

Prompt compiler behavior:

- High priority assets appear in every relevant prompt.
- Medium priority assets appear when useful.
- Low priority assets are summarized or omitted if prompt budget is tight.

## Stable labels

Use stable labels:

```txt
@LeadIdentity
@LeadWardrobe
@MainLocation
@CameraPushMotion
@SongAudio
```

Also support bracket labels:

```txt
[Image1]
[Video1]
[Audio1]
```

## Asset card actions

Every asset card should support:

- Copy stable label
- Copy bracket label
- Set role
- Set priority
- Set rights status
- Include in all jobs
- Include only selected jobs
- Mark do-not-use

## Rights status

- unknown
- owned
- licensed
- public-domain
- permission-granted
- do-not-use

Show warnings when rights status is unknown or do-not-use.

## Prompt hygiene

Bad labels:

- @Image1
- @CoolPic
- @Ref

Good labels:

- @LeadIdentity
- @RainStreetLocation
- @CameraPushMotion
- @ChorusAudio

## MVP requirement

Asset Map must be visible in the Image Studio inspector and Assets page. The mock generation receipt must include selected input asset IDs even if the mock provider does not use them.
