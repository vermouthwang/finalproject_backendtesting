type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "add User contact",
    endpoint: "/api/contact",
    method: "POST",
    fields: {contact: "input"}
  },
  {
    name: "Get all User Contacts",
    endpoint: "/api/contact",
    method: "GET",
    fields: {}
  },
  {
    name:"get letter by id",
    endpoint:"/api/letter/id",
    method:"GET",
    fields:{id:"input"}
  },
  {
    name: "Respond to a letter",
    endpoint: "/api/letterrespond",
    method: "POST",
    fields: {originalletter: "input", content: "input"}
  },
  {
    name: "Get response response",
    endpoint: "/api/letterrespond",
    method: "GET",
    fields: {originalletter: "input"}
  },
  {
    name: "Get primary respond",
    endpoint: "/api/primaryrespond",
    method: "GET",
    fields: {originalletter: "input"}
  },
  {
    name:"get letter receive by the user",
    endpoint:"/api/receiveletter",
    method:"GET",
    fields:{}
  },
  {
    name:"create Email contact",
    endpoint:"/api/contact/email",
    method:"POST",
    fields:{username:"input", email:"input"}
  },
  // {
  //   name: "check contact type",
  //   endpoint: "/api/contact/type",
  //   method: "GET",
  //   fields: {contact: "input"}
  // },
  // {
  //   name: "get email address by id",
  //   endpoint: "/api/email",
  //   method: "GET",
  //   fields: {_id: "input"}
  // },
  {
    name: "send letter",
    endpoint: "/api/letter",
    method: "PATCH",
    fields: { letter: "input" },
  },
  {
    name: "create letter",
    endpoint: "/api/letter",
    method: "POST",
    fields: { to: "json", content: "input", responseEnabled: "json", delay: "input" },
  },
  {
    name: "update letter content",
    endpoint: "/api/letter/content",
    method: "PATCH",
    fields: { letter: "input", content: "input" },
  },
  {
    name: "get letter by sender",
    endpoint: "/api/letter",
    method: "GET",
    fields: {},
  },
  {
    name: "get letter by receiver",
    endpoint: "/api/letter/receiver",
    method: "GET",
    fields: {user: "input"}
  },
  {
    name: "get all unsend letters of the user",
    endpoint: "/api/letterunsent",
    method: "GET",
    fields: {}
  },
  {
    name: "delete(unshow) letter(client)",
    endpoint: "/api/letter/client",
    method: "DELETE",
    fields: {letter: "input"}
  },
  {
    name: "delete letter(server)",
    endpoint: "/api/letter/client",
    method: "DELETE",
    fields: {letter: "input"}
  },
  // {
  //   name: "remove a receiver from a letter",
  //   endpoint: "/api/letter/receiver",
  //   method: "DELETE",
  //   fields: {letter: "input", receiver: "input"}
  // },
  // {
  //   name: "add a receiver to a letter",
  //   endpoint: "/api/letter/receiver",
  //   method: "PATCH",
  //   fields: {letter: "input", receiver: "input"}
  // },
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name:"send email",
    endpoint:"/api/email",
    method:"POST",
    fields:{to:"input", content:"input"}
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
