

const ANNOTATE_CHANGELOG = "@cds.changelog";

export const ANNOTATE_CHANGELOG_ENABLED = `${ANNOTATE_CHANGELOG}.enabled`;
export const ANNOTATE_CHANGELOG_EXTENSION_KEY = `${ANNOTATE_CHANGELOG}.extension.entityKey`;
export const ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_TYPE = `${ANNOTATE_CHANGELOG}.extension.for.type`;
export const ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET = `${ANNOTATE_CHANGELOG}.extension.key.target`;

export const CHANGELOG_NAMESPACE = "cap.community.common";

export const ENTITIES = {
  CHANGELOG: CHANGELOG_NAMESPACE + "." + "ChangeLog"
};

export const ACTIONS = {
  Create: "Create",
  Update: "Update",
  Delete: "Delete",
};