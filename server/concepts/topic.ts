import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface TopicDoc extends BaseDoc {
  author: ObjectId;
  title: string;
  content: string;
  posts: Array<ObjectId>;
}

export default class TopicConcept {
  public readonly topics = new DocCollection<TopicDoc>("topics");

  async create(author: ObjectId, title: string, content: string) {
    const _id = await this.topics.createOne({ author, title, content, posts: [] });
    return { msg: "Topic successfully created!", topic: await this.topics.readOne({ _id }) };
  }

  async getTopics(query: Filter<TopicDoc>) {
    const topics = await this.topics.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return topics;
  }

  async getNextTopics(page: number, pageSize: number) {
    try {
      // calculate skip
      const skip = (page - 1) * pageSize;
      // get topics
      const topics = await this.topics.readMany(
        {},
        {
          sort: { dateUpdated: -1 },
          skip: skip,
          limit: pageSize,
        },
      );
      // return topics
      return topics;
    } catch (err) {
      throw new NotFoundError(`No topics found!`);
    }
  }

  async getByAuthor(author: ObjectId) {
    return await this.getTopics({ author });
  }

  async update(_id: ObjectId, update: Partial<TopicDoc>) {
    this.sanitizeUpdate(update);
    await this.topics.updateOne({ _id }, update);
    return { msg: "Topic successfully updated!" };
  }

  async addPost(_id: ObjectId, post: ObjectId) {
    const topic = await this.topics.readOne({ _id });
    if (!topic) {
      throw new NotFoundError(`Topic ${_id} does not exist!`);
    }
    topic.posts.push(post);
    await this.topics.updateOne({ _id }, { posts: topic.posts });
    return { msg: "Post successfully added!" };
  }

  async delete(_id: ObjectId) {
    await this.topics.deleteOne({ _id });
    return { msg: "Topic deleted successfully!" };
  }

  async removePost(_id: ObjectId, post: ObjectId) {
    const topic = await this.topics.readOne({ _id });
    if (!topic) {
      throw new NotFoundError(`Topic ${_id} does not exist!`);
    }
    topic.posts = topic.posts.filter((p) => p.toString() !== post.toString());
    await this.topics.updateOne({ _id }, { posts: topic.posts });
    return { msg: "Post successfully deleted!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const topic = await this.topics.readOne({ _id });
    if (!topic) {
      throw new NotFoundError(`Topic ${_id} does not exist!`);
    }
    if (topic.author.toString() !== user.toString()) {
      throw new TopicAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<TopicDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["title", "content"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update ${key}!`);
      }
    }
  }
}

export class TopicAuthorNotMatchError extends NotAllowedError {
  constructor(user: ObjectId, _id: ObjectId) {
    super(`User ${user} is not the author of topic ${_id}!`);
  }
}
