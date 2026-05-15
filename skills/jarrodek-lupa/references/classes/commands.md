# Classes

## commands

### `Locator`
```ts
constructor(query: LocatorQuery): Locator
```
**Methods:**
- `blur(options?: BlurOptions): Promise<void>` — Calls blur on the element.
- `clear(options?: ClearOptions): Promise<void>` — Clear the input field.
- `check(options?: CheckOptions): Promise<void>` — Ensure that checkbox or radio element is checked.
- `click(options?: ClickOptions): Promise<void>` — Clicks on the element.
- `fill(text: string, options?: FillOptions): Promise<void>` — Fills the input field.
- `dblclick(options?: DoubleClickOptions): Promise<void>` — Double clicks the element.
- `hover(options?: HoverOptions): Promise<void>` — Hovers over the element.
- `press(key: string, options?: PressOptions): Promise<void>` — Presses the given key.
- `tap(options?: TapOptions): Promise<void>` — Taps the element.
- `uncheck(options?: UncheckOptions): Promise<void>` — Ensure that checkbox or radio element is unchecked.
