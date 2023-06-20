import Nife from 'nife';
import { Model, Types, MythixORMUtils } from 'mythix';
import Utils from '../utils/index.mjs';

// This is the base model class that all other
// models inherit from. It provides common
// functionality between all models.

export class ModelBase extends Model {
  static fields = {
    createdAt: {
      type:         Types.DATETIME,
      defaultValue: Types.DATETIME.Default.NOW,
      allowNull:    false,
      index:        true,
    },
    updatedAt: {
      type:         Types.DATETIME,
      defaultValue: Types.DATETIME.Default.NOW.UPDATE,
      allowNull:    false,
      index:        true,
    },
  };

  static defaultOrder() {
    return [ `${this.getModelName()}:createdAt` ];
  }

  static isValidID(id, modelName) {
    return Utils.isValidID(id, modelName);
  }

  isValidID(id, modelName) {
    return this.constructor.isValidID(id, modelName);
  }

  static getModelIDPrefix() {
    return Utils.getModelIDPrefixFor(this.getModelName());
  }

  getModelIDPrefix() {
    return this.constructor.getModelIDPrefix();
  }

  static getModelTypeAndIDFromID(id) {
    return Utils.getModelTypeAndIDFromID(id);
  }

  getModelTypeAndIDFromID(id) {
    return this.constructor.getModelTypeAndIDFromID(id);
  }

  static getModelNameFromID(id) {
    return Utils.getModelNameFromIDPrefix(id);
  }

  getModelNameFromID(id) {
    return this.constructor.getModelNameFromID(id);
  }

  static stripIDPrefix(id) {
    return Utils.stripIDPrefix(id);
  }

  stripIDPrefix(id) {
    return this.constructor.stripIDPrefix(id);
  }

  static addIDPrefix(id) {
    return Utils.addIDPrefix(id);
  }

  addIDPrefix(id) {
    return this.constructor.addIDPrefix(id);
  }

  static getModelTypeAndID(_modelOrID) {
    if (!_modelOrID)
      return;

    let modelOrID = _modelOrID;
    if (modelOrID instanceof ModelBase) {
      return {
        type: modelOrID.getModelName(),
        id:   modelOrID.id,
      };
    } else if (modelOrID.type && modelOrID.id) {
      return modelOrID;
    } else if (this.isValidID(modelOrID)) {
      return this.getModelTypeAndIDFromID(modelOrID);
    }
  }

  getModelTypeAndID(_modelOrID) {
    return this.constructor.getModelTypeAndID(_modelOrID);
  }

  // MythixORM "getModel" only returns the current
  // model... so here we overload to be able to
  // fetch a model by name.
  getModel(modelName) {
    if (!modelName)
      return super.getModel();

    let connection = this.getConnection();
    return connection.getModel(modelName);
  }

  getModels() {
    let connection = this.getConnection();
    return connection.getModels();
  }

  throwNotFoundError(message, code) {
    throw new Utils.NotFoundError(message || 'Not Found', code);
  }

  throwForbiddenError(message, code) {
    throw new Utils.ForbiddenError(message || 'Forbidden', code);
  }

  langTerm(...args) {
    return Utils.langTerm(...args);
  }

  // This will take a "query object"
  // and convert it into a Mythix ORM query
  generateQueryFromFilter(Model, filter) {
    if (Nife.isEmpty(filter))
      return;

    return MythixORMUtils.generateQueryFromFilter(this.getConnection(), Model, filter);
  }

  static collectEmails(emails) {
    return Nife.toArray(emails).filter((email) => {
      if (!email)
        return false;

      if (!Nife.instanceOf(email, 'string'))
        return false;

      if (email.indexOf('@') < 0)
        return false;

      return true;
    }).map((email) => email.toLowerCase());
  }

  collectEmails(emails) {
    return this.constructor.collectEmails(emails);
  }

  async getBasicUserInfo(userID, organizationID) {
    if (Nife.isEmpty(userID))
      throw new Error('"userID" required.');

    let {
      OrganizationUserLink,
      User,
    } = this.getModels();

    if (Nife.isEmpty(organizationID)) {
      let user = await User.where.id.EQ(userID).first();

      return {
        id:            userID,
        email:         user.email,
        firstName:     user.firstName,
        lastName:      user.lastName,
        userAvatarURL: null,
      };
    }

    // Join user against OrganizationUserLink
    let query = User.$
      .id
      .EQ(OrganizationUserLink.$.userID)
      .AND
      .id
      .EQ(userID)
      .AND
      .OrganizationUserLink.organizationID.EQ(organizationID);

    // Pluck attributes from both tables
    let attributes = await query.LIMIT(1).pluck([
      'User:email',
      'User:firstName',
      'User:lastName',
      'OrganizationUserLink:email',
      'OrganizationUserLink:firstName',
      'OrganizationUserLink:lastName',
      'OrganizationUserLink:userAvatarURL',
    ]);

    if (Nife.isEmpty(attributes))
      return null;

    let [
      userEmail,
      userFirstName,
      userLastName,
      orgEmail,
      orgFirstName,
      orgLastName,
      userAvatarURL,
    ] = ((attributes && attributes[0]) || []);

    // Prioritize OrganizationUserLink demographics
    // over User demographics... but fallback to
    // User demographics if OrganizationUserLink
    // demographics are empty.
    return {
      id:            userID,
      email:         orgEmail || userEmail || null,
      firstName:     orgFirstName || userFirstName || null,
      lastName:      orgLastName || userLastName || null,
      userAvatarURL: userAvatarURL || null,
    };
  }
}
