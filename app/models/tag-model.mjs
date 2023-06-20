'use strict';

import { defineModel } from 'mythix';
import { ModelBase } from './model-base.js';
import { TaggableBase } from './taggable-base.js';
import Utils from '../utils.js';

// Tags (for users) are stored on the UserOrganizationLink
// model, as they are per user/org combo.

module.exports = defineModel('Tag', ({ Parent, Types }) => {
  return class _Tag extends Parent {
    static fields = {
      ...(Parent.fields || {}),
      id: {
        type:         Types.XID({ prefix: Utils.getModelIDPrefixFor('Tag') }),
        defaultValue: Types.XID.Default.XID,
        allowNull:    false,
        primaryKey:   true,
      },
      sourceType: {
        type:         Types.STRING(64),
        allowNull:    false,
        index:        true,
      },
      sourceID: {
        type:         Types.STRING(24),
        allowNull:    false,
        index:        true,
      },
      targetType: {
        type:         Types.STRING(64),
        defaultValue: null,
        allowNull:    true,
        index:        true,
      },
      targetID: {
        type:         Types.STRING(24),
        defaultValue: null,
        allowNull:    true,
        index:        true,
      },
      name: {
        type:         Types.STRING(128),
        allowNull:    false,
        index:        true,
        validate:     {
          is: /^[\w_-]+$/,
        },
      },
    };

    static _sanitizeTagName = TaggableBase._sanitizeTagName;

    static async createFor(source, tagNames, target, options) {
      if (!source)
        return;

      return await source.addTags.call(source, target, tagNames, options);
    }

    async getSource(options) {
      let sourceType    = this.sourceType;
      const SourceModel = this.getModel(sourceType);

      return await SourceModel.where[SourceModel.getPrimaryKeyFieldName()].EQ(this.sourceID).first(null, options);
    }

    async getTarget(options) {
      let targetType    = this.targetType;
      const TargetModel = this.getModel(targetType);

      return await TargetModel.where[TargetModel.getPrimaryKeyFieldName()].EQ(this.targetID).first(null, options);
    }
  };
}, ModelBase);
