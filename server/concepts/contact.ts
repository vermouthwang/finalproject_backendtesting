
import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface ContactDoc extends BaseDoc {
  owner: ObjectId;
  contact: ObjectId;
  type: "User" | "NonUser";
}

export interface EmailContactDoc extends BaseDoc {
  username: string;
  email: string;
}

export interface patientPasscodeDoc extends BaseDoc {
  patient: ObjectId;
  passcode: string;
}

export async function compareIdbyString(a: ObjectId, b: ObjectId) {
  return a.toString() === b.toString();
}

export default class ContactConcept {
  public readonly contacts = new DocCollection<ContactDoc>("contacts");
  public readonly emailContacts = new DocCollection<EmailContactDoc>("emailContacts");
  public readonly patientPasscodes = new DocCollection<patientPasscodeDoc>("patientPasscodes");

  async createAppUserContact(owner: ObjectId, contact: ObjectId, type: "User" | "NonUser" = "User") {
    const _id = await this.contacts.createOne({ owner, contact, type });
    return { msg: "App User Contact successfully created!", contact: await this.contacts.readOne({ _id }) };
  }

  async createEmailContact(owner: ObjectId, username: string, email: string) {
    const exists = await this.checkifemailcontactexists(username);
    if (exists) {
      throw new Error("This contact name already exists, please choose another.");
    }
    const contact = await this.emailContacts.createOne({ username, email });
    if (!contact) {
      throw new Error("Email Contact not created!");
    }
    const newcontact = await this.contacts.createOne({ owner, contact, type: "NonUser" });
    return { msg: "Email Contact successfully created!", contact: await this.emailContacts.readOne({ _id:contact }) };
  }

  async checkifemailcontactexists(username: string) {
    const contact = await this.emailContacts.readOne({ username });
    if (!contact) {
      return false;
    }
    return true;
  }
  
  async createPatientPasscode(patient: ObjectId, passcode: string) {
    const _id = await this.patientPasscodes.createOne({ patient, passcode });
  }

  async getContactsbyOwner(owner: ObjectId) {
    const contacts = await this.contacts.readMany({ owner });
    return contacts;
  }

  async getContactsbyContact(contact: ObjectId) {
    const contacts = await this.contacts.readMany({ contact });
    return contacts[0];
  }

  async getEmailContactbyId(_id: ObjectId) {
    const emailContact = await this.emailContacts.readOne({ _id });
    return emailContact;
  }
  
  async getEmailContactbyUsername(username: string) {
    const emailContact = await this.emailContacts.readOne({ username });
    return emailContact;
  }

  async checkContactType(owner: ObjectId, contact: ObjectId) {
    const allContacts = await this.getContactsbyOwner(owner);
    for (const c of allContacts) {
      if (await compareIdbyString(c.contact, contact)) {
        return c.type;
      }
    }
    throw new NotFoundError("Contact not found!");
  }

  async getemailaddressbyId(_id: ObjectId) {
    const contact = await this.getEmailContactbyId(_id);
    if (!contact) {
      return null;
    }
    return contact.email;
  }
}