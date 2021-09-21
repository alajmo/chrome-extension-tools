import { capitalize } from 'lodash'
import { PluginContext } from 'rollup'
import { isString } from './helpers'
import {
  Asset,
  JsonAsset,
  Manifest,
  ManifestAsset,
  PluginsStartOptions,
  RawAsset,
  RPCEHooks,
  RPCEPlugin,
  StringAsset,
} from './types'

export async function runPlugins(
  this: PluginContext,
  plugins: RPCEPlugin[],
  { hook, ...asset }: PluginsStartOptions,
): Promise<Asset> {
  if (asset.fileType === 'CSS' || asset.fileType === 'HTML') {
    return runStringPlugins.call(this, asset, plugins, hook)
  } else if (asset.fileType === 'JSON') {
    return runJsonPlugins.call(this, asset, plugins, hook)
  } else if (asset.fileType === 'MANIFEST') {
    return runManifestPlugins.call(this, asset, plugins, hook)
  } else if (
    asset.fileType === 'IMAGE' ||
    asset.fileType === 'RAW'
  ) {
    return runRawPlugins.call(this, asset, plugins, hook)
  } else {
    return asset
  }
}

async function runRawPlugins(
  this: PluginContext,
  asset: RawAsset,
  plugins: RPCEPlugin[],
  hook: string,
) {
  let file = asset
  for (const p of plugins) {
    const result = (await p[
      `${hook}Crx${capitalize(asset.fileType)}` as Extract<
        keyof RPCEHooks,
        `${typeof hook}Crx${'Raw' | 'Image'}`
      >
    ]?.call(this, file.source as any, file as any)) as
      | undefined
      | null
      | Uint8Array
      | RawAsset

    if (result instanceof Uint8Array) file.source = result
    else if (result) file = result
  }
  return file
}

async function runManifestPlugins(
  this: PluginContext,
  asset: ManifestAsset,
  plugins: RPCEPlugin[],
  hook: string,
) {
  const file = asset
  for (const p of plugins) {
    const result = (await p[
      `${hook}Crx${capitalize(file.fileType)}` as
        | 'transformCrxManifest'
        | 'renderCrxManifest'
    ]?.call(this, file.source as any)) as
      | undefined
      | null
      | Manifest

    if (result) file.source = result
  }
  return file
}

async function runJsonPlugins(
  this: PluginContext,
  asset: JsonAsset,
  plugins: RPCEPlugin[],
  hook: string,
) {
  let file = asset
  for (const p of plugins) {
    const result = (await p[
      `${hook}Crx${capitalize(asset.fileType)}` as
        | 'transformCrxJson'
        | 'renderCrxJson'
    ]?.call(this, file)) as undefined | null | JsonAsset

    if (result) file = result
  }
  return file
}

async function runStringPlugins(
  this: PluginContext,
  asset: StringAsset,
  plugins: RPCEPlugin[],
  hook: string,
) {
  let file = asset
  for (const p of plugins) {
    const result = (await p[
      `${hook}Crx${capitalize(asset.fileType)}` as Extract<
        keyof RPCEHooks,
        `${typeof hook}Crx${Capitalize<
          Lowercase<typeof asset.fileType>
        >}`
      >
    ]?.call(this, file.source as any, file as any)) as
      | undefined
      | null
      | string
      | StringAsset

    if (isString(result)) file.source = result
    else if (result) file = result
  }
  return file
}