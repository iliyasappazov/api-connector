import test from 'ava';
import { Pipe } from '../lib/utils';

test('piped callbacks are called sequentially', (t) => {
  const initialResponse = {
    data: {
      inner: 'value',
    },
  };

  const pipe = new Pipe();
  pipe.join(response => response.data);
  pipe.join(data => data.inner);
  pipe.join(inner => t.is(inner, 'value'));

  pipe.process(initialResponse);
});
