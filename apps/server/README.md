
# Details and instructions

Logger usage:

```ts
this.logger.error({ id: `...` }, `message`) // object passed in first argument
```

set context in module

```ts
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class Service {
  private readonly logger = new Logger(Service.name);

  ...
}
```
