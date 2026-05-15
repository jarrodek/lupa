# [1.4.0](https://github.com/jarrodek/lupa/compare/v1.3.1...v1.4.0) (2026-05-15)


### Features

* add commands for remote test control ([2761a33](https://github.com/jarrodek/lupa/commit/2761a33502e1cc99124b5f4406a8cdb168f4f8bf))
* extract browser log handling into a dedicated class ([c438be5](https://github.com/jarrodek/lupa/commit/c438be52828f795dded5894d5812ffd757c53ff2))

## [1.3.1](https://github.com/jarrodek/lupa/compare/v1.3.0...v1.3.1) (2026-05-15)


### Bug Fixes

* fixes [#1](https://github.com/jarrodek/lupa/issues/1) - fixture function to work in group setup ([46dea54](https://github.com/jarrodek/lupa/commit/46dea547df457f55d4bc3877b5f8c61758f8956d))
* fixes [#2](https://github.com/jarrodek/lupa/issues/2) - fixture should define type template ([1412df6](https://github.com/jarrodek/lupa/commit/1412df6e95f3b375d3f4c0a5926002ce0e03a808))
* fixes [#3](https://github.com/jarrodek/lupa/issues/3) - fixture should allow text templates ([fc982a5](https://github.com/jarrodek/lupa/commit/fc982a5a95f1819b657213f8c6629e2ad06af1d6))
* fixes [#4](https://github.com/jarrodek/lupa/issues/4) allow custom JS / CSS in the test harness ([b8a8f06](https://github.com/jarrodek/lupa/commit/b8a8f062e0c9d4d3d5a8ef05604a0be0e03ce54c))

# [1.3.0](https://github.com/jarrodek/lupa/compare/v1.2.0...v1.3.0) (2026-05-14)


### Bug Fixes

* resolve absolute path for testPlugins in integration fixtures using node:path ([87d8389](https://github.com/jarrodek/lupa/commit/87d83896af5d20a0fcfe91f266f3b62310c22d02))


### Features

* resolve test plugins for browser access and add global filesystem permissions ([d0cdb6e](https://github.com/jarrodek/lupa/commit/d0cdb6eac155839d9595d4b11a87e342bb254ebe))

# [1.2.0](https://github.com/jarrodek/lupa/compare/v1.1.0...v1.2.0) (2026-05-14)


### Features

* add dom.hasStyle assertion and async testing helpers, and update integration tests accordingly ([b69ef77](https://github.com/jarrodek/lupa/commit/b69ef7752f41a287bdbfe641aa4f45e2211fc863))
* implement native code coverage reporting using istanbul and nyc ([23426eb](https://github.com/jarrodek/lupa/commit/23426ebd91eff570eb1f93996269c045b3f2c05e))

# [1.1.0](https://github.com/jarrodek/lupa/compare/v1.0.0...v1.1.0) (2026-05-14)


### Features

* implement semantic DOM assertions with configurable element matching ([3324967](https://github.com/jarrodek/lupa/commit/3324967e4f4027ad5ddb25114552057bc4625400))

# 1.0.0 (2026-05-14)


### Features

* add lupa-testing skill documentation for framework test standards ([06db33e](https://github.com/jarrodek/lupa/commit/06db33ec77ae23d1f108586107dfad84013ff71d))
* add support for custom Vite configuration files via CLI and config options ([d6bc2a3](https://github.com/jarrodek/lupa/commit/d6bc2a3c81bc33d45f472b976494ee35fcc1a8a9))
* add support for custom Vite configuration in CLI and programmatic usage ([b6c7d0e](https://github.com/jarrodek/lupa/commit/b6c7d0edf7be0ec305398ca83ec133d853f6f77c))
* implement CI pipeline with GitHub Actions for linting, build, and cross-environment testing ([0ce1d23](https://github.com/jarrodek/lupa/commit/0ce1d23d3355a41109031f4c04281b5222d76bd5))
* integrate semantic-release for automated versioning and release workflows ([33382d6](https://github.com/jarrodek/lupa/commit/33382d67b674bbb4f513c17485c1f888b8ee434c))
* integrate TypeDoc for automated API documentation and GitHub Pages deployment ([fe8eee2](https://github.com/jarrodek/lupa/commit/fe8eee20530a8608c0525cc9bee4afb54b6b09d4))
* prioritize failed tests in file selection menu with color-coded console output ([7a84e06](https://github.com/jarrodek/lupa/commit/7a84e06d0496a7d5e5e38a69ebb5d30d87232f8b))
* replace full test suite re-run with event replay mechanism and enable devtools for Chromium debugging ([fc1a931](https://github.com/jarrodek/lupa/commit/fc1a9312b006e007426ee1ba358b9594992eb8d8))
