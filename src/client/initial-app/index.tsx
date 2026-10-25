/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { h, render } from 'preact';
import App from './App';
// Listen for the install prompt as early as possible
import 'shared/install';

// Scroll-reveal content is only hidden once we know JS is running
document.documentElement.classList.remove('no-js');

const root = document.getElementById('app') as HTMLElement;

async function main() {
  if (!__PRODUCTION__) await import('preact/debug');
  render(<App />, root);
}

main();
