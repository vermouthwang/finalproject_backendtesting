// - **Concept: Delay [ T ]**
//     - **Purpose:** perform operation on content after a specified amount of time
//     - **Operating Principle:** after a specified time ***t**,* execute a function ***f*** on a piece of content of type ***T***
//     - **State**
//         - *content*: Set *T*
//         - *behavior*: *content* → One *function*
//         - *activation*: content → One Date
//     - **Actions**
//         - *createDelay*: *content* → One Delay
//         - *getDelay*: *content* → One Delay
//         - *deleteDelay*: *content* → One Delay
//         - *checkifDelayisOnTime*: *content* → One Boolean
//         - *getSortedDelaysIndex*: *content* → One Number
//         - *insertNewDelayIntoSortedDelays*: *content* → One Number
//         - *getNearestDelay*: *content* → One Delay
//         - *removeNearestDelay*: *content* → One Delay



import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface DelayDoc<T> extends BaseDoc {
  content: ObjectId;
  type: "Diary" | "Letter"
  // store a function in the behavior, although args are not all known
  // behavior: Function;
  behavior: "add" | "delete" | "reveal" | "hide"
  activation: Date;
  otherargs?: any[];
}
//test
// export function testBehavior(content: any, other: string) {
//   console.log(content, other );
// }

export default class DelayConcept<T> {
  public readonly Delays = new DocCollection<DelayDoc<T>>("Delays");
  // create a array of Date
  public readonly SortedDelaysTime =  new Array<Date>();
  public readonly SortedDelays = new Array<DelayDoc<T>>();

  async createDelay(content: ObjectId, behavior: "add" | "delete" | "reveal" | "hide" , activation: Date, otherargs?: any[]) {
    const _id = await this.Delays.createOne({ content, behavior, activation, otherargs });
    // push the delay to the SortedDelays by comparing the activation time
    const newdelay = await this.Delays.readOne({ _id });
    if (newdelay === null) {
      throw new NotFoundError("New Delay did not create", _id);
    }
    // await this.insertNewDelayIntoSortedDelays(newdelay);
    return { msg: "Created Delay!", delay: await this.Delays.readOne({ _id }) };
  }

  async getDelaysbyId(_id: ObjectId) {
    const thedelay = await this.Delays.readOne({ _id });
    if (thedelay === null) {
      throw new NotFoundError("No such delay", _id);
    }
    return thedelay
  }

  async getDelaybyContent(content: ObjectId) {
    // Get the delay by the content 
    const delays = await this.Delays.readMany({ content : content });
    if (delays === null) {
      throw new NotFoundError("No such delay", content);
    }
    return delays
    }
  
  async deleteDelaybyId(_id: ObjectId) {
    // delete the delay by the id
    const thedelay = await this.Delays.readOne({ _id });
    if (thedelay === null) {
      throw new NotFoundError("No such delay", _id);
    }
    // delete the delay from doc
    await this.Delays.deleteOne({ _id });
    // delete the delay from SortedDelays
    // const index = this.SortedDelays.indexOf(thedelay);
    // this.SortedDelays.splice(index, 1);
    // this.SortedDelaysTime.splice(index, 1);
    return { msg: "Deleted Delay!" };
  }

  async updateDelayActivation(_id: ObjectId, newactivation: Date) {
    // update the activation time of the delay
    const thedelay = await this.Delays.readOne({ _id });
    if (thedelay === null) {
      throw new NotFoundError("No such delay", _id);
    }
    // update the activation time of the delay
    await this.Delays.updateOne({ _id }, { activation: newactivation });
    // update the activation time of the SortedDelays
    // const index = this.SortedDelays.indexOf(thedelay);
    // this.SortedDelaysTime[index] = newactivation;
    return { msg: "Updated Delay Activation!" };
  }

  async checkifDelayisOnTime(id: ObjectId, activation: Date) {
    const delays = await this.getDelaysbyId(id);
    const activationtime = delays.activation;
    const now = new Date();
    if (activationtime.getTime() <= now.getTime()) {
      return true
    }
    else { 
      return false
    }
  }

  // SortedDelaysTime & SortedDelays
  async getSortedDelaysIndex( newdelayactivation: Date) {
    if (this.SortedDelaysTime.length === 0) {
      return 0
    }
    // loop through the SortedDelays and return the new delay right place index
    for (let i = 0; i < this.SortedDelaysTime.length-1; i++) {
      if (newdelayactivation.getTime() > this.SortedDelaysTime[i].getTime() && newdelayactivation.getTime() < this.SortedDelaysTime[i+1].getTime()) {
        return i+1
      }
    }
    return -1
  }

  async insertNewDelayIntoSortedDelays( newdelay: DelayDoc<T>) {
    const newdelayactivation = newdelay.activation;
    const index = await this.getSortedDelaysIndex(newdelayactivation);
    this.SortedDelaysTime.splice(index, 0, newdelayactivation);
    this.SortedDelays.splice(index, 0, newdelay);
    return { msg: "Inserted Delay at index " + index };
  }

  async getNearestDelay() {
    // return the delay at the first index of the SortedDelays
    return this.SortedDelays[0]
  }

  async removeNearestDelay() {
    // delete the delay at the first index of the SortedDelays
    const deleteddelay = this.SortedDelays.shift();
    this.SortedDelaysTime.shift();
    return deleteddelay
  }
}


// const incoming = new Date(/* date you are receiving */)
// const deadline = new Date()
// deadline.setHours(deadline.getHours() + 2)

// if (incoming.getTime() > deadline.getTime()) {
//   // Error...
// }

// Everything is fine, do your work


  // async testDelay(content: T) {
  //   // test the createDelay function using a lambda function
  //   const afunction = testBehavior;
  //   const testdelay = await this.createDelay(content, afunction, new Date());
  //   if (testdelay.delay === null) {
  //     throw new NotFoundError("Delay", testdelay.delay);
  //   }
  //   const thefunction = testdelay.delay.behavior;
  //   thefunction(content);
  // }

  // async activeDelay(dealy: ObjectId) {
  //   // run the behavior of the delay
  //   const theDelay = await this.Delays.readOne({ _id: dealy });
  //   if (theDelay === null) {
  //     throw new NotFoundError("Delay", dealy);
  //   }
  //   theDelay.behavior(theDelay.content);
  // }


//test
