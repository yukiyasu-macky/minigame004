import manifest from "../assets/asset_manifest.json";

const byId = new Map(manifest.assets.map((asset) => [asset.id, asset]));

export const assetManifest = manifest;

export const getAssetMeta = (id) => byId.get(id) || null;

export const listAssetsByCategory = (category) =>
  manifest.assets.filter((asset) => asset.category === category);

export const listAssetsByPriority = (priority) =>
  manifest.assets.filter((asset) => asset.priority === priority);

export const runtimeAssetPath = (id) => {
  const asset = getAssetMeta(id);
  if (!asset?.runtimeTarget) return "";
  return `${import.meta.env.BASE_URL}${asset.runtimeTarget.replace(/^public\//, "")}`;
};

