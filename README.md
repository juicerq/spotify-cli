spotify-cli
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/spotify-cli.svg)](https://npmjs.org/package/spotify-cli)
[![Downloads/week](https://img.shields.io/npm/dw/spotify-cli.svg)](https://npmjs.org/package/spotify-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g spotify-cli
$ spotify-cli COMMAND
running command...
$ spotify-cli (--version)
spotify-cli/0.0.0 linux-x64 node-v23.8.0
$ spotify-cli --help [COMMAND]
USAGE
  $ spotify-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`spotify-cli hello PERSON`](#spotify-cli-hello-person)
* [`spotify-cli hello world`](#spotify-cli-hello-world)
* [`spotify-cli help [COMMAND]`](#spotify-cli-help-command)
* [`spotify-cli plugins`](#spotify-cli-plugins)
* [`spotify-cli plugins add PLUGIN`](#spotify-cli-plugins-add-plugin)
* [`spotify-cli plugins:inspect PLUGIN...`](#spotify-cli-pluginsinspect-plugin)
* [`spotify-cli plugins install PLUGIN`](#spotify-cli-plugins-install-plugin)
* [`spotify-cli plugins link PATH`](#spotify-cli-plugins-link-path)
* [`spotify-cli plugins remove [PLUGIN]`](#spotify-cli-plugins-remove-plugin)
* [`spotify-cli plugins reset`](#spotify-cli-plugins-reset)
* [`spotify-cli plugins uninstall [PLUGIN]`](#spotify-cli-plugins-uninstall-plugin)
* [`spotify-cli plugins unlink [PLUGIN]`](#spotify-cli-plugins-unlink-plugin)
* [`spotify-cli plugins update`](#spotify-cli-plugins-update)

## `spotify-cli hello PERSON`

Say hello

```
USAGE
  $ spotify-cli hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ spotify-cli hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/juicerq/spotify-cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `spotify-cli hello world`

Say hello world

```
USAGE
  $ spotify-cli hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ spotify-cli hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/juicerq/spotify-cli/blob/v0.0.0/src/commands/hello/world.ts)_

## `spotify-cli help [COMMAND]`

Display help for spotify-cli.

```
USAGE
  $ spotify-cli help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for spotify-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.26/src/commands/help.ts)_

## `spotify-cli plugins`

List installed plugins.

```
USAGE
  $ spotify-cli plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ spotify-cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/index.ts)_

## `spotify-cli plugins add PLUGIN`

Installs a plugin into spotify-cli.

```
USAGE
  $ spotify-cli plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into spotify-cli.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SPOTIFY_CLI_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SPOTIFY_CLI_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ spotify-cli plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ spotify-cli plugins add myplugin

  Install a plugin from a github url.

    $ spotify-cli plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ spotify-cli plugins add someuser/someplugin
```

## `spotify-cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ spotify-cli plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ spotify-cli plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/inspect.ts)_

## `spotify-cli plugins install PLUGIN`

Installs a plugin into spotify-cli.

```
USAGE
  $ spotify-cli plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into spotify-cli.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SPOTIFY_CLI_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SPOTIFY_CLI_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ spotify-cli plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ spotify-cli plugins install myplugin

  Install a plugin from a github url.

    $ spotify-cli plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ spotify-cli plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/install.ts)_

## `spotify-cli plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ spotify-cli plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ spotify-cli plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/link.ts)_

## `spotify-cli plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ spotify-cli plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ spotify-cli plugins unlink
  $ spotify-cli plugins remove

EXAMPLES
  $ spotify-cli plugins remove myplugin
```

## `spotify-cli plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ spotify-cli plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/reset.ts)_

## `spotify-cli plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ spotify-cli plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ spotify-cli plugins unlink
  $ spotify-cli plugins remove

EXAMPLES
  $ spotify-cli plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/uninstall.ts)_

## `spotify-cli plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ spotify-cli plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ spotify-cli plugins unlink
  $ spotify-cli plugins remove

EXAMPLES
  $ spotify-cli plugins unlink myplugin
```

## `spotify-cli plugins update`

Update installed plugins.

```
USAGE
  $ spotify-cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/update.ts)_
<!-- commandsstop -->
