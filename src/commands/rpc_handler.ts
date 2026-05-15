import type { Page } from 'playwright'
import type {
  CommandNames,
  DownPayload,
  Media,
  PressPayload,
  SelectOptionPayload,
  SendKeysPayload,
  SendMousePayload,
  TypePayload,
  UpPayload,
  Viewport,
} from './types.js'

function isTypePayload(payload: SendKeysPayload): payload is TypePayload {
  return 'type' in payload
}

function isPressPayload(payload: SendKeysPayload): payload is PressPayload {
  return 'press' in payload
}

function isDownPayload(payload: SendKeysPayload): payload is DownPayload {
  return 'down' in payload
}

function isUpPayload(payload: SendKeysPayload): payload is UpPayload {
  return 'up' in payload
}

/**
 * A class that handles the RPC calls from the browser to the runner.
 */
export class CommandsHandler {
  protected page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Expose the RPC handler to the browser.
   */
  async boot() {
    await this.page.exposeFunction('__lupa_command__', async (command: CommandNames, payload: any) => {
      switch (command) {
        case 'setViewport':
          await this.handleSetViewport(payload)
          break
        case 'emulateMedia':
          await this.handleEmulateMedia(payload)
          break
        case 'sendKeys':
          await this.handleSendKeys(payload)
          break
        case 'sendMouse':
          await this.handleSendMouse(payload)
          break
        case 'resetMouse':
          await this.handleResetMouse()
          break
        case 'selectOption':
          await this.handleSelectOption(payload)
          break
        default:
          throw new Error(`Unknown lupa command: ${command}`)
      }
    })
  }

  /**
   * Handle setViewport command.
   */
  protected async handleSetViewport(payload: Viewport) {
    await this.page.setViewportSize(payload)
  }

  /**
   * Handle emulateMedia command.
   */
  protected async handleEmulateMedia(payload: Media) {
    await this.page.emulateMedia(payload)
  }

  /**
   * Handle sendKeys command.
   */
  protected async handleSendKeys(payload: SendKeysPayload) {
    if (isTypePayload(payload)) {
      await this.page.keyboard.type(payload.type)
    }
    if (isPressPayload(payload)) {
      await this.page.keyboard.press(payload.press)
    }
    if (isDownPayload(payload)) {
      await this.page.keyboard.down(payload.down)
    }
    if (isUpPayload(payload)) {
      await this.page.keyboard.up(payload.up)
    }
  }

  /**
   * Handle sendMouse command.
   */
  protected async handleSendMouse(payload: SendMousePayload) {
    switch (payload.type) {
      case 'move':
        if (payload.position) {
          await this.page.mouse.move(payload.position[0], payload.position[1])
        }
        break
      case 'down':
        await this.page.mouse.down({ button: payload.button, clickCount: payload.clickCount })
        break
      case 'up':
        await this.page.mouse.up({ button: payload.button, clickCount: payload.clickCount })
        break
      case 'click':
        if (payload.position) {
          await this.page.mouse.click(payload.position[0], payload.position[1], {
            button: payload.button,
            clickCount: payload.clickCount,
          })
        }
        break
      default:
        throw new Error(`Unknown sendMouse type: ${payload.type}`)
    }
  }

  /**
   * Handle resetMouse command.
   */
  protected async handleResetMouse() {
    await this.page.mouse.move(0, 0)
    await this.page.mouse.up()
  }

  /**
   * Handle selectOption command.
   */
  protected async handleSelectOption(payload: SelectOptionPayload) {
    await this.page.selectOption(payload.selector, payload.value)
  }
}
