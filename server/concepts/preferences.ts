import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface PreferenceDoc extends BaseDoc {
  user: ObjectId;
  interval: number;
  expiry: number;
  features: Map<String, String>;
}

export default class PreferenceConcept {
  public readonly preferences = new DocCollection<PreferenceDoc>("preferences");

  /**
   * Initialize a set of preferences for a user.
   * @param user ObjectId associated with a user
   * @param interval amount of time between prompting to update preferences
   * @returns a PreferenceDoc w/ expiry= current time + interval, and an empty set of preferences
   */
  async initialize(user: ObjectId, interval: number) {
    const _id = await this.preferences.createOne({ user, interval, expiry: Date.now() + interval, features: new Map<String, String>() });
    return { msg: "Initialized User preferences.", preferences: await this.preferences.readOne({ _id }) };
  }

  /**
   * Helper function to get the PreferenceDoc associated w/ a specific user
   * @param user ObjectId associated with a user
   * @returns PreferenceDoc that is associated w/ 'user'
   */
  async getUserPreferences(user: ObjectId) {
    const userPreferences = await this.preferences.readOne({ user });
    if (!userPreferences) {
      throw new NotFoundError("No preferences found for this user.");
    }
    return userPreferences;
  }

  /**
   * Create or Update a preference for a specific user
   * @param user ObjectId associated with a user
   * @param feature name of preference to create/update
   * @param setting value of the preference associated w/ 'feature'
   * @returns adds k,v pair {feature: setting} to 'this.preferences.features'
   */
  async setPreference(user: ObjectId, feature: string, setting: string) {
    const features = (await this.getUserPreferences(user)).features;
    features.set(feature, setting);
    await this.preferences.updateOne({ user }, { features });
    return { msg: `Set preference... "${feature}: ${setting}"` };
  }

  /**
   * Remove a preference for a specific user
   * @param user ObjectId associated with a user
   * @param feature name of preference to remove
   * @returns deleted k,v pair {feature: setting} from 'this.preferences.features'
   */
  async removePreference(user: ObjectId, feature: string) {
    const features = (await this.getUserPreferences(user)).features;
    features.delete(feature);
    await this.preferences.updateOne({ user }, { features });
    return { msg: `Removed preference for "${feature}"` };
  }

  /**
   * Reset all preferences for a user
   * @param user ObjectId associated with a user
   * @returns updates 'this.preferences.features' to {}
   */
  async resetPreferences(user: ObjectId) {
    await this.preferences.updateOne({ user }, { features: new Map<String, String>() });
    return { msg: "Reset all user preferences." };
  }

  /**
   * Change the amount of time between prompting a user to update their preferences
   * @param user ObjectId associated with a user
   * @param interval (updated) amount of time for users to be prompted about preferences
   * @returns updates 'this.preferences.interval' to interval
   */
  async changeInterval(user: ObjectId, interval: number) {
    await this.preferences.updateOne({ user }, { interval });
    return { msg: "Changed user's preference interval." };
  }

  /**
   * Checks whether the current interval has expired based on a user's interval and expiry.
   * This function will be used to prompt the user about updating their preferences.
   *
   * @param user ObjectId associated with a user
   * @returns true iff the current date is past the expiry date.
   */
  async isExpired(user: ObjectId) {
    const userPref = await this.getUserPreferences(user);
    return Date.now() >= userPref.expiry;
  }

  /**
   * Updates the expiry date for a user
   * @param user ObjectId associated with a user
   * @returns sets 'this.preferences.expiry' = current time + 'this.preferences.interval'
   */
  async updateExpiry(user: ObjectId) {
    const userPref = await this.getUserPreferences(user);
    await this.preferences.updateOne({ user }, { expiry: Date.now() + userPref.interval });
    return { msg: "Updated Preferences' expiry" };
  }
}
