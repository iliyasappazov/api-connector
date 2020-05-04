import test from 'ava';
import { Pipe } from '../lib/utils';

test('piped callbacks are called sequentially', (t) => {
  const initialResponse = {
    data: {
      inner: 'value',
    },
  };

  const pipe = new Pipe();
  pipe.join((response) => response.data)
    .join((data) => data.inner)
    .join((inner) => t.is(inner, 'value'));

  pipe.process(initialResponse);
});

test(
  'after a repeated call, the pipe process method continues processing, starting with the newly added callbacks',
  (t) => {
    const data = { value: 1 };
    let innerData = data;
    for (let i = 0; i < 5; i += 1) {
      innerData.inner = { value: innerData.value + 1 };
      innerData = innerData.inner;
    }

    const handler = (curData) => curData.inner;

    const pipe = new Pipe();
    pipe.join(handler)
      .join(handler)
      .join(handler);

    pipe.process(data);

    pipe.join((curData) => {
      t.is(curData.value, 4);
      return curData.inner;
    });
    pipe.join((curData) => {
      t.is(curData.value, 5);
    });
    pipe.process();
  },
);
