import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface WishDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  fulfilled: boolean;
  visibility: "public" | ObjectId[] | "private";
}

export default class WishConcept {
  public readonly wishes = new DocCollection<WishDoc>("wishes");

  async create(author: ObjectId, content: string, visibility: "public" | ObjectId[] | "private") {
    const _id = await this.wishes.createOne({ author, content, visibility, fulfilled: false });
    return { msg: "Wish successfully created!", wish: await this.wishes.readOne({ _id }) };
  }

  async getWishes(query: Filter<WishDoc>) {
    const wishes = await this.wishes.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return wishes;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getWishes({ author });
  }

  async update(_id: ObjectId, update: Partial<WishDoc>) {
    this.sanitizeUpdate(update);
    await this.wishes.updateOne({ _id }, update);
    return { msg: "Wish successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.wishes.deleteOne({ _id });
    return { msg: "Wish deleted successfully!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const wish = await this.wishes.readOne({ _id });
    if (!wish) {
      throw new NotFoundError(`Wish ${_id} does not exist!`);
    }
    if (wish.author.toString() !== user.toString()) {
      throw new WishAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<WishDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "visibility", "fulfilled"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update ${key}!`);
      }
    }
  }
}

export class WishAuthorNotMatchError extends NotAllowedError {
  constructor(user: ObjectId, _id: ObjectId) {
    super(`User ${user} is not the author of wish ${_id}!`);
  }
}
