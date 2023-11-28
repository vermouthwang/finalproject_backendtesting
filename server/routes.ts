import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Delay, Email, Friend, Letter, Post, Topic, User, WebSession, Wish } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { TopicDoc } from "./concepts/topic";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import { WishDoc } from "./concepts/wish";
import Responses from "./responses";

class Routes {
  // ############################################################
  // session
  // ############################################################
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  // ############################################################
  // user
  // ############################################################
  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  // @Router.get("/users/:username")
  // async getUser(username: string) {
  //   return await User.getUserByUsername(username);
  // }

  @Router.get("/users/:username")
  async getUserType(username: string) {
    const userType = await User.getUserType(username);
    return { userType };
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  // ############################################################
  // post
  // ############################################################
  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  // ############################################################
  // friend
  // ############################################################
  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // ############################################################
  // wish
  // ############################################################
  @Router.get("/wishes")
  async getWishes(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.wishes(await Wish.getByAuthor(user));
  }

  @Router.post("/wishes")
  async createWish(session: WebSessionDoc, content: string, visibility: "public" | ObjectId[] | "private") {
    const user = WebSession.getUser(session);
    const created = await Wish.create(user, content, visibility);
    return { msg: created.msg, wish: await Responses.wish(created.wish) };
  }

  @Router.patch("/wishes/:_id")
  async updatewish(session: WebSessionDoc, _id: ObjectId, update: Partial<WishDoc>) {
    const user = WebSession.getUser(session);
    await Wish.isAuthor(user, _id);
    return await Wish.update(_id, update);
  }

  @Router.delete("/wishes/:_id")
  async deletewish(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Wish.isAuthor(user, _id);
    return Wish.delete(_id);
  }

  // ############################################################
  // Topic/Forum
  // ############################################################
  @Router.get("/topics")
  async getTopics(page?: number, pagesize?: number) {
    // default page = 1, pagesize = 10
    const currentPage = page || 1;
    const pageSize = pagesize || 10;
    const totoalCount = await Topic.topics.count({});
    const pageCount = Math.ceil(totoalCount / pageSize);
    return { topics: await Topic.getNextTopics(currentPage, pageSize), page: currentPage, pageSize: pageSize, totalPage: pageCount, totalCount: totoalCount };
  }

  @Router.post("/topics")
  async createTopic(session: WebSessionDoc, title: string, content: string) {
    const user = WebSession.getUser(session);
    const created = await Topic.create(user, title, content);
    return { msg: created.msg, topic: await Responses.topic(created.topic) };
  }

  @Router.patch("/topics/:_id")
  async updateTopic(session: WebSessionDoc, _id: ObjectId, update: Partial<TopicDoc>) {
    const user = WebSession.getUser(session);
    await Topic.isAuthor(user, _id);
    return await Topic.update(_id, update);
  }

  @Router.delete("/topics/:_id")
  async deleteTopic(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Topic.isAuthor(user, _id);
    return Topic.delete(_id);
  }

  @Router.post("/topic/:_id/post")
  async addPostToTopic(_id: ObjectId, post: ObjectId) {
    return await Topic.addPost(_id, post);
  }

  @Router.delete("topic/:_id/post")
  async removePostFromTopic(session: WebSessionDoc, _id: ObjectId, post: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, post);
    return await Topic.removePost(_id, post);
  }

  // ############################################################
  // Letter
  // ############################################################
  @Router.post("/letter")
  async createLetter( session: WebSessionDoc, 
                      to: ObjectId[] , 
                      content: string, 
                      responseEnabled: boolean,
                      delay?: string) {
    const user = WebSession.getUser(session);
    const newletter = await Letter.createLetter(user, to, content, responseEnabled);
    if (delay) {
      const delaydate = new Date(delay);
      if (newletter.letter !== null) {
        const letterdelay = await Delay.createDelay(newletter.letter._id, "reveal", delaydate)
        return { msg: "Letter created successfully!", letter: newletter, delay: letterdelay };
      }
    }
    return { msg: "Letter created successfully!", letter: newletter };
  }

  @Router.get("/letter")
  async getLetterbySender(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Letter.getLetterBySender(user);
  }

  @Router.get("/letter/receiver")
  async getLetterbyReceiver(user: ObjectId) {
    return await Letter.getLetterByReceiver(user);
  }

  @Router.delete("/letter/receiver")
  async removeReceiver(session: WebSessionDoc, letter: ObjectId, receiver: ObjectId) {
    const user = WebSession.getUser(session);
    const theletter = await Letter.getLetterById(letter);
    if (theletter.from.toString() !== user.toString()) {
      throw new Error("You are not the sender of this letter!");
    }
    return await Letter.removeLetterReceiver(letter, receiver);
  }

  @Router.patch("/letter/receiver")
  async addReceiver(session: WebSessionDoc, letter: ObjectId, receiver: ObjectId) {
    const user = WebSession.getUser(session);
    const theletter = await Letter.getLetterById(letter);
    if (theletter.from.toString() !== user.toString()) {
      throw new Error("You are not the sender of this letter!");
    }
    return await Letter.addLetterReceiver(letter, receiver);
  }

  @Router.patch("/letter")
  async sendLetter(session: WebSessionDoc, letter: ObjectId) {
    const user = WebSession.getUser(session);
    const theletter = await Letter.getLetterById(letter);
    if (theletter.from.toString() !== user.toString()) {
      throw new Error("You are not the author of this letter!");
    }
    return await Letter.sendLetter(letter);
  }

  @Router.post("/email")
  async sendEmail(user: ObjectId, to: string, content: string) {
    const username = (await User.getUserById(user)).username;
    await Email.send(username,to, content);
    return { msg: "Email sent!" };
  }
}



export default getExpressRouter(new Routes());
