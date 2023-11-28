import ContactConcept from "./concepts/contact";
import DelayConcept from "./concepts/delay";
import EmailConcept from "./concepts/email";
import FriendConcept from "./concepts/friend";
import LetterConcept from "./concepts/letter";
import PostConcept from "./concepts/post";
import TopicConcept from "./concepts/topic";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";
import WishConcept from "./concepts/wish";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Wish = new WishConcept();
export const Topic = new TopicConcept();
export const Delay = new DelayConcept();
export const Letter = new LetterConcept();
export const Email = new EmailConcept();
export const Contact = new ContactConcept();