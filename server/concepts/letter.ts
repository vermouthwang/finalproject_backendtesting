//test push
// Note: Letter Concept Module
// Date: 04/18/2020
//_____________________________________________
// **Purpose: ***share content with others*
// **Operating Principle:
// **State
//   *LetterDoc<T>:
//      from: ObjectId;
//      to: ObjectId[];
//      content: T;
//      responseEnabled: boolean;
//      response: LetterResponseDoc<T>[];
//      send: boolean;
//      show: boolean;
//   *LetterResponseDoc<T>:
//      letter: ObjectId;
//      responsefrom: ObjectId;
//      content: T | null;
//      response: LetterResponseDoc<T>[];
// **Actions
//    createLetter(from: ObjectId, to: ObjectId[], content: T, responseEnabled: boolean, response: LetterResponseDoc<T>[] = [], send: boolean = false, show: boolean = true)
//    getLetterById(_id: ObjectId)
//    getLetterBySender(sender: ObjectId)
//    getLetterByReceiver(receiver: ObjectId)
//    getAllunsendLetter()
//    updateLetterContent(_id: ObjectId, content: T)
//    removeLetterReceiver(_id: ObjectId, receiver: ObjectId)
//    addLetterReceiver(_id: ObjectId, receiver: ObjectId)
//    addLetterResponsetoLetter(_id: ObjectId,response: LetterResponseDoc<T>)
//    sendLetter(_id: ObjectId)
//    unshowLetter(_id: ObjectId)
//    deleteLetter_client(_id: ObjectId)
//    deleteLetter_server(_id: ObjectId)
//    createLetterResponse(letter: ObjectId, responsefrom: ObjectId, content: T | null , response: LetterResponseDoc<T>[] = [])
//    getLetterResponseById(_id: ObjectId)
//    getAllLetterResponseByLetter(originalletter: ObjectId)
//    getLetterResponseByresponsefrom(responsefrom: ObjectId)
//    updateResponseResponse(_id: ObjectId, response: LetterResponseDoc<T>)
//    recursivelyDeleteLetterResponse(letter: ObjectId)

import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface LetterDoc<T> extends BaseDoc {
  from: ObjectId;
  to: ObjectId[];
  content: string;
  responseEnabled: boolean;
  type: "letters" | "responses";
  response: LetterDoc<T>[];
  send: boolean;
  show: boolean;
}
// export interface LetterResponseDoc<T> extends BaseDoc {
//   letter: ObjectId;
//   responsefrom: ObjectId;
//   content: string | null;
//   response: LetterResponseDoc<T>[];
// }

export async function compareIdbyString(a: ObjectId, b: ObjectId) {
  return a.toString() === b.toString();
}

export default class LetterConcept<T> {
  public readonly letters = new DocCollection<LetterDoc<T>>("letters");
  // public readonly letterResponses = new DocCollection<LetterResponseDoc<T>>("letterResponses");

  async createLetter( from: ObjectId, 
                      to: ObjectId[], 
                      content: string, 
                      responseEnabled: boolean, 
                      type: "letters" | "responses" = "letters", 
                      response: LetterDoc<T>[] = [], 
                      send: boolean = false, 
                      show: boolean = true) {
    const _id = await this.letters.createOne({ from, to, content, responseEnabled, response, type, send, show });
    return { msg: "Letter successfully saved!", letter: await this.letters.readOne({ _id }) };
  }

  //GET____________________________________________________________________________
  async getLetterById(_id: ObjectId) {
    const letters = await this.letters.readOne({ _id });
    if (!letters) {
      throw new NotFoundError(`Letter ${_id} does not exist!`);
    }
    return letters;
  }

  //this one only serve letter type letter, not response
  async getLetterBySender(sender: ObjectId) {
    const letters =  await this.letters.readMany({ from: sender, type: "letters" });
    if (!letters) {
      throw new NotFoundError(`There is no Letter original from ${sender}.`);
    }
    return letters;
  }
  //this one only serve letter type letter, not response
  async getLetterByReceiver(receiver: ObjectId) {
    // loop through all the letter and compared by toString
    const letters = await this.letters.readMany({type: "letters"});
    let result: LetterDoc<T>[] = [];
    for (const letter of letters) {
      for (const to of letter.to) {
        if (await compareIdbyString(to, receiver)) {
          result.push(letter);
        }
      }
    }
    if (result.length === 0) {
      throw new NotFoundError(`There is no Letter to ${receiver}.`);
    }
    return result;
  }

  //no type checking because all response are sent automatically
  async getAllUnsentLetterbySender(sender: ObjectId) {
    const letters = await this.letters.readMany({ from: sender, send: false });
    return letters;
  }

  // only serve letter type letter, not response
  async getAllSendLetter() {
    const letters = await this.letters.readMany({ send: true, type: "letters" });
    return letters;
  }

  async receiveLetter(receiver: ObjectId) {
    const letters = await this.getLetterByReceiver(receiver)
    // const letters = await this.letters.readMany({ to: receiver, send: true });
    const receivedLetter: LetterDoc<T>[] = [];
    for (const letter of letters) {
      if (letter.send && letter.show) {
        receivedLetter.push(letter);
      }
    }
    return receivedLetter;
  }

  //UPDATE____________________________________________________________________________
  async updateLetterContent(_id: ObjectId, content: string) {
    const letters = await this.getLetterById(_id)
    if (letters.send === true) {
      throw new NotAllowedError(`Letter ${_id} has been sent, you cannot change the content.`);
    }
    await this.letters.updateOne({ _id }, { content });
    return { msg: "Letter content is updated!" };
  }

  async removeLetterReceiver(_id: ObjectId, receiver: ObjectId) {
    const letters = await this.getLetterById(_id)
    if (letters.send === true) {
      throw new NotAllowedError(`Letter ${_id} has been sent, you cannot remove the receiver.`);
    }
    const oldTo = letters.to;
    for (const to of oldTo) {
      if (await compareIdbyString(to, receiver)) {
        //remove the receiver
        oldTo.splice(oldTo.indexOf(to), 1);
        // update
        await this.letters.updateOne({ _id }, { to: oldTo });
        return { msg: "The receiver is removed!", letter: await this.letters.readOne({ _id }) };
      }
    }
    throw new NotFoundError(`Letter ${_id} does not have receiver ${receiver}.`);
    // const newTo = letters.to.filter((value) => !compareIdbyString(value, receiver));
    // if (oldTo.length === newTo.length) {
    //   throw new NotFoundError(`Letter ${_id} does not have receiver ${receiver}.`);
    // }
    // else {
    //   await this.letters.updateOne({ _id }, { to: newTo });
    // }
    // return { msg: "The receiver is removed!" };
  }

  async addLetterReceiver(_id: ObjectId, receiver: ObjectId) {
    const letters = await this.getLetterById(_id)
    if (letters.send === true) {
      throw new NotAllowedError(`Letter ${_id} has been sent, you cannot add the receiver.`);
    }
    const oldTo = letters.to;
    const newTo = letters.to.concat(receiver);
    if (oldTo.length === newTo.length) {
      throw new NotAllowedError(`Letter ${_id} already has receiver ${receiver}.`);
    }
    else {
      await this.letters.updateOne({ _id }, { to: newTo });
    }
    return { msg: "The receiver is added!" };
  }

  // async addLetterResponsetoLetter(_id: ObjectId,response: LetterResponseDoc<T>) {
  //   const letters = await this.getLetterById(response.letter)
  //   if (!letters.responseEnabled){
  //     throw new NotAllowedError(`Letter ${_id} is not response allowed.`);
  //   }
  //   //push the new response to the letter response list
  //   const oldResponse = letters.response;
  //   const newResponse = letters.response.concat(response);
  //   await this.letters.updateOne({ _id }, { response: newResponse });
  //   return { msg: "The response is added!" };
  // }

  async sendLetter(_id: ObjectId) {
    const letters = await this.getLetterById(_id)
    if (letters.send === true) {
      throw new NotAllowedError(`Letter has already been sent.`);
    }
    await this.letters.updateOne({ _id }, { send: true });
    return { msg: "Letter is sent!" };
  }

  async unshowLetter(_id: ObjectId) {
    //for client oepartion, remove the letter from the client's view, but the revceiver can still see it
    const letters = await this.getLetterById(_id)
    await this.letters.updateOne({ _id }, { show: false });
    return { msg: "Letter is removed!" };
  }

  //DELETE____________________________________________________________________________
  async deleteLetter_client(_id: ObjectId) {
    // for client operation, the client can only delete the letter that has not been sent
    // if the letter has been sent, the client can only unshow the letter (to themselves)
    const letters = await this.getLetterById(_id)
    if (letters.send) {
      return await this.unshowLetter(_id);
    }
    await this.deleteLetter_server(_id);
    await this.recursivelyDeleteLetterResponse(letters)
    return { msg: "Letter deleted successfully!" };
  }

  async deleteLetter_server(_id: ObjectId) {
    //for server oepartion, we do not need to check if the letter has been sent or not
    const letters = await this.getLetterById(_id)
    //delete response first
    await this.recursivelyDeleteLetterResponse(letters)
    await this.letters.deleteOne({ _id });
    return { msg: "Letter deleted successfully!" };
  }

  async recursivelyDeleteLetterResponse(letter: LetterDoc<T>) {
    const theletterResponses = letter.response;
    if (theletterResponses.length > 0) {
      for (const letterResponse of theletterResponses) {
        //first delete the response of the response
        await this.recursivelyDeleteLetterResponse(letterResponse);
        await this.letters.deleteOne({ _id: letterResponse._id });
      }
    }
    else {
      return { msg: "Letter response deleted successfully!" };
    }
  }

  async respondtoLetter (from: ObjectId, originalletter: ObjectId, content: string, ){
    const originalletterdoc = await this.getLetterById(originalletter)
    if (!originalletterdoc.responseEnabled){
      throw new NotAllowedError(`Letter ${originalletter} is not response allowed.`);
    }
    if (originalletterdoc.send !== true) {
      throw new NotAllowedError(`Letter ${originalletter} has not been sent yet, you cannot response to it.`);
    }
    const to = [originalletterdoc.from]
    const response = await this.createLetter(from, to, content, true, "responses", [], true, true)
    //update the original letter
    if (response.letter){
      await this.updateLetterResponse(originalletter, response.letter)
      return {msg: "Successfully respond!", letter: response.letter}
    } 
    return {msg: "Failed to respond!"}
  }

  async updateLetterResponse(_id: ObjectId, response: LetterDoc<T>) {
    const letters = await this.getLetterById(_id)
    //push the new response to the letter response list
    const oldResponse = letters.response;
    const newResponse = oldResponse.concat(response);
    await this.letters.updateOne({ _id }, { response: newResponse });
  }

  async getLetterResponseByLetter(_id: ObjectId) {
    const letters = await this.getLetterById(_id)
    // return {msg: "not implemented yet"}
    const responses = letters.response
    const result = [responses]
    // result.concat(responses)
    if (responses.length > 0) {
      for (const response of responses) {
        const subresponse = await this.getLetterResponseByLetter(response._id)
        //push the new response to the letter response list
        for (const sub of subresponse) {
          result.push(sub)
        }
      }
    }
    return result
  }

  async getPrimaryResponse(id: ObjectId) {
    const letter = await this.getLetterById(id)
    const responses = letter.response
    return responses
  }

  //type check
  async checkifLetter(object: ObjectId){
    const letter = await this.letters.readOne({ _id: object });
    if (letter === null){
      return false;
    }
    return true;
  }
  // ________________________________________________________________________________________________________________________________________________________
  // aync function for letterResponse________________________________________________________________________________________________________________________
  // async createLetterResponse(letter: ObjectId, responsefrom: ObjectId, content: string | null , response: LetterResponseDoc<T>[] = []) {
  //   if (await this.checkifLetter(letter)){
  //     const letters = await this.getLetterById(letter)
  //     if (!letters.responseEnabled){
  //       throw new NotAllowedError(`Letter ${letter} is not response allowed.`);
  //     }
  //     if (letters.send !== true) {
  //       throw new NotAllowedError(`Letter ${letter} has not been sent yet, you cannot response to it.`);
  //     }
  //     const _id = await this.letterResponses.createOne({ letter, responsefrom, content, response });
  //     return { msg: "Successfully respond!", letterResponse: await this.letterResponses.readOne({ _id }) };
  //   } else if (await this.checkifLetterResponse(letter)){
  //     // const letterResponse = await this.getLetterResponseById(letter)
  //     const _id = await this.letterResponses.createOne({ letter: letter, responsefrom, content, response });
  //     //update the response's response
  //     const Responsesresponse = await this.letterResponses.readOne({_id})
  //     if (Responsesresponse) {
  //       await this.updateResponseResponse(letter, Responsesresponse);
  //       return { msg: "Successfully respond!", letterResponse: await this.letterResponses.readOne({ _id }) };
  //     }
  //   }
  // }
  //GET
  // async getLetterResponseById(_id: ObjectId) {
  //   const response = await this.letterResponses.readOne({ _id });
  //   if (!response) {
  //     throw new NotFoundError(`Letter response ${_id} does not exist!`);
  //   }
  //   return response;
  // }

  // async getAllLetterResponseByLetter(originalletter: ObjectId) {
  //   return await this.letterResponses.readMany({ letter: originalletter });
  // }

  // async getLetterResponseByresponsefrom(responsefrom: ObjectId) {
  //   return await this.letterResponses.readMany({ responsefrom });
  // }

  // //UPDATE
  // async updateResponseResponse(_id: ObjectId, response: LetterResponseDoc<T>) {
  //   const theletterResponse = await this.getLetterResponseById(_id)
  //   //push the new response to the letter response list
  //   const oldResponse = theletterResponse.response;
  //   const newResponse = oldResponse.concat(response);
  //   await this.letterResponses.updateOne({ _id }, { response: newResponse });
  //   return { msg: "The response is added!" };
  // }

  //DELETE
  // async recursivelyDeleteLetterResponse(letter: ObjectId) {
  //   const theletterResponses = await this.getAllLetterResponseByLetter(letter);
  //   for (const letterResponse of theletterResponses) {
  //     //first delete the response of the response
  //     if (letterResponse.response.length > 0) {
  //       await this.recursivelyDeleteLetterResponse(letterResponse.letter);
  //     }
  //     await this.letterResponses.deleteOne({ _id: letterResponse._id });
  //   }
  //   return { msg: "Letter response deleted successfully!" };
  // }



  // async checkifLetterResponse(object: ObjectId){
  //   const letterResponse = await this.letterResponses.readOne({ _id: object });
  //   if (letterResponse === null){
  //     return false;
  //   }
  //   return true;
  // }
}