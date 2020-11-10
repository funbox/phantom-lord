import { EventEmitter } from 'events';

declare class RemoteBrowser extends EventEmitter {
  public state: 'notStarted' | 'starting' | 'started' | 'exiting';
  public isInitialized: boolean;
  public pid: number;

  private testSettings: { [prop: string]: any };
  private browserErrors: { msg: string }[];
  private stubsQueue: Stub[];
  private cookiesQueue: Cookie[];
  private localStorageItemsQueue: LocalStorageItem[];
  private requestInterceptor: Fn;

  // browser state managers

  startRemoteBrowser(): Promise<void>;

  closePage(): Promise<void>;

  closeAllPages(): Promise<void>;

  exit(): Promise<void>;

  // page content managers

  addCookieToQueue(cookie: Cookie): Promise<void|never>;

  addLocalStorageItemToQueue(item: LocalStorageItem): Promise<void|never>;

  addStubToQueue(stub: Stub): Promise<void|never>;

  addTestSetting(setting: string, value: any): void;

  capture(filename: string): Promise<void>;

  captureInPath(pathArg: string): Promise<void>;

  clear(selector: Selector): Promise<void|never>;

  click(selector: Selector, elementX?: number, elementY?: number): Promise<void|never>;

  /**
   * @param {string} label - text that should be inside the tag
   * @param {string=} tag - tag that should be clicked
   */
  clickLabel(label: string, tag?: string): Promise<void|never>;

  clickSelectorText(selector: Selector, text: string): Promise<void|never>

  clickViaOther(selector: Selector, otherSelector: Selector): Promise<void|never>

  /**
   * @param {Function} fn - function that will be evaluated on the page
   * @param {...*} args - arguments of the function
   */
  evaluate(fn: string | ((...args: any[]) => any), ...args: any[]): Promise<any>

  fillForm(formSelector: Selector, vals: Record<string, any>, options?: Options): Promise<void|never>;

  fillSelectors(formSelector: Selector, vals: Record<string, any>, submit?: boolean): Promise<void|never>;

  hover(selector: Selector, elementX?: number, elementY?: number): Promise<void|never>;

  open(url: string): Promise<void|never>;

  scrollSelectorToBottom(selector: Selector): Promise<void|never>;

  scrollSelectorToTop(selector: Selector): Promise<void|never>;

  sendKeys(selector: Selector, keys: string, caretPosition?: 'start'|'end'|number): Promise<void|never>;

  wait(timeout: number): Promise<void>;

  waitFor(fn: Fn, fnName: string, onTimeout?: Fn): Promise<void|never>;

  waitForCount(selector: Selector, expectedCount: number, onTimeout?: Fn): Promise<void|never>;

  waitForEventListener(selector: Selector, eventType: string, onTimeout?: Fn): Promise<void|never>;

  waitForSelector(selector: Selector, onTimeout?: Fn): Promise<void|never>;

  waitForSelectorText(selector: Selector, expectedText: any, exactMatch?: boolean, onTimeout?: Fn): Promise<void|never>;

  waitForSelectorValue(selector: Selector, expectedValue: any, onTimeout?: Fn): Promise<void|never>;

  waitForTab(url: string|RegExp, fn?: () => Promise<void>, onTimeout?: Fn): Promise<void|never>;

  waitForText(text: string, onTimeout?: Fn): Promise<void|never>;

  waitForUrl(url: string|RegExp, onTimeout?: Fn): Promise<void|never>;

  waitUntilVisible(selector: Selector, onTimeout?: Fn): Promise<void|never>;

  waitWhileSelector(selector: Selector, onTimeout?: Fn): Promise<void|never>;

  waitWhileText(text: string, onTimeout?: Fn): Promise<void|never>;

  waitWhileVisible(selector: Selector, onTimeout?: Fn): Promise<void|never>;

  // utils methods

  xpath(expression: string): Exclude<Selector, string>;
  setRequestInterceptor(callback: Fn): void;

  // internals methods
  // should be placed here for proper tests working

  private checkSelectorText(selector: Selector, text: any, exactMatch?: boolean): Promise<void|never>;
  private checkSelectorValue(selector: Selector, value: any): Promise<void|never>;
  private expectSelector(expectedState: 'exists'|'notExists', selector: Selector): Promise<void|never>;
  private expectVisibilityState(expectedState: 'visible'|'invisible', selector: Selector): Promise<void|never>;
  private fill(formSelector: Selector, vals: Record<string, any>, findType: string): Promise<FillOut>;
  private getCount(selector: Selector): Promise<number|never>;
  private getCurrentUrl(): Promise<string|never>;
  private getSelectorText(selector: Selector, firstOfFound: boolean): Promise<string|never>;

  /** @deprecated */
  sendCmd(...args: any[]): Promise<void>;
  /** @deprecated */
  static deleteLocalStorageBaseDir(): void;

  static WAIT_TIMEOUT: number;
  static CHECK_INTERVAL: number;
  static HEADLESS: boolean;
  static SLOW_MO: number;
}

declare global {
  const browser: RemoteBrowser;
}

type Cookie = {
  name: string,
  value: string,
};

type Stub = {
  method: string,
  url: string | RegExp,
  data: any,
};

type LocalStorageItem = {
  key: string,
  value: string,
};

type Selector = string | {
  type: 'css' | 'xpath',
  path: string,
};

type Options = Partial<{
  selectorType: string,
  submit: boolean,
}>;

type FillOut = {
  errors: string[],
  fields: Record<string, boolean>,
  files: Record<'type'|'selector'|'path', string>[],
};

type Fn = (...args: any[]) => void;

export = RemoteBrowser;
