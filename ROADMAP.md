# Roadmap

## Removing default values for first params of `expectSelector` and `expectVisibilityState`

For unknown historical reasons these commands declare default value for the first parameter.
Currently we have to disable linter for them, but actually this is kind of silly design.

The default values for the params should be removed in the next major release.
