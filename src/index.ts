import chalk from 'chalk';
import dgram from 'node:dgram';
import dnsPacket from 'dns-packet';

const server = dgram.createSocket('udp4');

const db = {
  'google.com': '1.2.3.4',
  'blog.google.com': '5.7.8.9',
};

server.on('message', (msg, rinfo) => {
  const incomingReq = dnsPacket.decode(msg);
  const ipFromDb = db[incomingReq.questions?.[0].name as keyof typeof db];

  const ans = dnsPacket.encode({
    type: 'response',
    id: incomingReq.id,
    flags: dnsPacket.AUTHORITATIVE_ANSWER,
    questions: incomingReq.questions,
    answers: [
      {
        type: 'A',
        class: 'IN',
        name: incomingReq.questions?.[0].name as keyof typeof db,
        data: ipFromDb,
      },
    ],
  });

  server.send(ans, rinfo.port, rinfo.address);

  console.dir(
    {
      msg: incomingReq,
      rinfo,
    },
    { depth: null, colors: true }
  );
});

server.on('error', (err) => {
  console.error(chalk.redBright('UDP Server error:'), err);
  server.close();
});

server.bind(8080, () => {
  console.log(chalk.greenBright(`DNS Server is running on port 8080`));
});
