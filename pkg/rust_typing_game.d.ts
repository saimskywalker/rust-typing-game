/* tslint:disable */
/* eslint-disable */
export function main(): void;
export enum AppState {
  Loading = 0,
  Welcome = 1,
  Language = 2,
  Timer = 3,
  Countdown = 4,
  Playing = 5,
  TimesUp = 6,
  Results = 7,
}
export class TypingApp {
  free(): void;
  constructor();
  initialize(): void;
  set_user_name(name: string): boolean;
  set_language(lang_code: string, lang_name: string): void;
  set_duration(duration: number): void;
  proceed_to_language(): void;
  proceed_to_timer(): void;
  start_countdown(): void;
  countdown_tick(): void;
  start_game_session(): void;
  generate_new_sentence(): string;
  start_typing(): void;
  update_typing_progress(typed_text: string): any;
  show_results(): void;
  restart_game(): void;
  change_settings(): void;
  new_session(): void;
  test_connection(): string;
  readonly user_name: string;
  readonly current_language: string;
  readonly current_sentence: string;
  readonly session_wpm: number;
  readonly session_accuracy: number;
  readonly remaining_time: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_typingapp_free: (a: number, b: number) => void;
  readonly typingapp_new: () => number;
  readonly typingapp_initialize: (a: number) => void;
  readonly typingapp_set_user_name: (a: number, b: number, c: number) => number;
  readonly typingapp_set_language: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly typingapp_set_duration: (a: number, b: number) => void;
  readonly typingapp_proceed_to_language: (a: number) => void;
  readonly typingapp_proceed_to_timer: (a: number) => void;
  readonly typingapp_start_countdown: (a: number) => void;
  readonly typingapp_countdown_tick: (a: number) => void;
  readonly typingapp_start_game_session: (a: number) => void;
  readonly typingapp_generate_new_sentence: (a: number) => [number, number];
  readonly typingapp_start_typing: (a: number) => void;
  readonly typingapp_update_typing_progress: (a: number, b: number, c: number) => any;
  readonly typingapp_show_results: (a: number) => void;
  readonly typingapp_restart_game: (a: number) => void;
  readonly typingapp_change_settings: (a: number) => void;
  readonly typingapp_new_session: (a: number) => void;
  readonly typingapp_user_name: (a: number) => [number, number];
  readonly typingapp_current_language: (a: number) => [number, number];
  readonly typingapp_current_sentence: (a: number) => [number, number];
  readonly typingapp_session_wpm: (a: number) => number;
  readonly typingapp_session_accuracy: (a: number) => number;
  readonly typingapp_remaining_time: (a: number) => number;
  readonly typingapp_test_connection: (a: number) => [number, number];
  readonly main: () => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
