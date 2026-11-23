# Cancel agreement

The owner queues a reversal of a labor agreement. A project that is not active does not queue. A project the server has closed refuses the queued reversal.

## Sub-features

- `cancel-agreement`

## How to get to it (user POV)

Open the agreement on «مقاول» and choose «عكس». The reason field reuses «سبب التصحيح».

## Driving it with verify-aj

`node scripts/verify-aj.js drive cancel-agreement`

The drive saves one agreement while the phone still shows the project as active, then an admin sets that project to `closed` with rules disabled. The cancel is queued and refused. The phone shows `رُفض الإرسال`. The server keeps the original agreement and no `rev_`.

## Gotchas

A refused `rev_` does not cancel measurement or approval. The export is restored to null. An unknown id still exits 3.
