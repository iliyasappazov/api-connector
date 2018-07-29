import {createServer, port} from "./_server";
import {Pipe} from "../lib/utils";
import test from "ava"

test("piped callbacks are called sequentially", t => {
    const response = {
        data: {
            inner: "value"
        }
    };

    const pipe = new Pipe();
    pipe.join(response => response.data);
    pipe.join(data => data.inner);
    pipe.join(inner => t.is(inner, "value"));

    pipe.process(response);
});
