const { expect } = require('chai');

describe('Synthetix v3', function() {
  let beacon;
  let nebulaProxy, nebulaImplementation;
  let pulsarProxy, pulsarImplementation;

  describe('when deploying the first version of the system', () => {
    before('deploy the beacon', async () => {
      const Beacon = await ethers.getContractFactory('Beacon');
      beacon = await Beacon.deploy();

      await beacon.deployed();
    });

    before('deploy implementations', async () => {
      const Nebula = await ethers.getContractFactory('NebulaV1');
      nebulaImplementation = await Nebula.deploy();
      await nebulaImplementation.deployed();

      const Pulsar = await ethers.getContractFactory('PulsarV1');
      pulsarImplementation = await Pulsar.deploy();
      await pulsarImplementation.deployed();
    });

    before('upgrade the beacon to version 1', async () => {
      const nebulaName = ethers.utils.formatBytes32String('nebula')
      const pulsarName = ethers.utils.formatBytes32String('pulsar')

      let tx = await beacon.upgrade(
        [nebulaName, pulsarName],
        [nebulaImplementation.address, pulsarImplementation.address]
      );

      await tx.wait();

      let proxyAddress = await beacon.getProxy(nebulaName);
      nebulaProxy = await ethers.getContractAt(
        'NebulaV1',
        proxyAddress
      );

      proxyAddress = await beacon.getProxy(pulsarName);
      pulsarProxy = await ethers.getContractAt(
        'PulsarV1',
        proxyAddress
      );

      tx = await nebulaProxy.initialize(beacon.address);
      await tx.wait();

      tx = await pulsarProxy.initialize(beacon.address);
      await tx.wait();
    });

    it('retrieves the correct version', async () => {
      const version = await beacon.getVersion();

      expect(version.toString()).to.equal('1');
    });

    it('retrieves the correct implementation and version for sender', async () => {
      const [ implementation, version ] = await beacon.getImplementationAndVersionForSender();

      expect(implementation.toString()).to.equal('0x0000000000000000000000000000000000000000');
      expect(version.toString()).to.equal('1');
    });

    it('properly forwards to the implementations', async () => {
      expect(await nebulaProxy.whoami()).to.equal('NebulaV1');
      expect(await pulsarProxy.whoami()).to.equal('PulsarV1');
    });

    it.only('properly appends the version in the calldata', async () => {
      expect(await nebulaProxy.getAppendedVersion()).to.equal('0000000000000000000000000000000000000000000000000000000000000001');
    });

    it('properly records extendedcalldata', async () => {
      const tx = await nebulaProxy.recordCalldata();
      await tx.wait();

      const recordedCalldata = await nebulaProxy.getRecordedCalldata();
      const recordedSelector = recordedCalldata.substr(2, 10);
      const recordedVersion = recordedCalldata.substr(11, recordedCalldata.length);

      expect(recordedSelector).to.equal('7c79c26f');
      expect(recordedVersion).to.equal('0000000000000000000000000000000000000000000000000000000000000001');
    });

    it('properly connects modules and caches them', async () => {
      const pulsarAddress = await nebulaProxy.doSomethingWithAnotherModule();
      console.log(pulsarAddress);

      expect(pulsarAddress).to.equal(pulsarProxy.address);

      // Should revert?
      const thing = await nebulaProxy.doSomethingWithAnotherModule();
      console.log(thing);
    });

    describe('when upgrading the system to version 2', () => {
      before('deploy implementations', async () => {
        const Nebula = await ethers.getContractFactory('NebulaV2');
        nebulaImplementation = await Nebula.deploy();

        await nebulaImplementation.deployed();
      });

      before('upgrade the beacon to version 2', async () => {
        const nebulaName = ethers.utils.formatBytes32String('nebula')

        const tx = await beacon.upgrade(
          [nebulaName],
          [nebulaImplementation.address]
        );

        await tx.wait();

        const proxyAddress = await beacon.getProxy(nebulaName);
        nebulaProxy = await ethers.getContractAt(
          'NebulaV2',
          proxyAddress
        );
      });

      it('upgraded to version 2', async () => {
        const version = await beacon.getVersion();

        expect(version.toString()).to.equal('2');
      });

      it('properly forwards to the implementation', async () => {
        expect(await nebulaProxy.whoami()).to.equal('NebulaV2');
        expect(await pulsarProxy.whoami()).to.equal('PulsarV1');
      });

      it('properly appends the version in the calldata', async () => {
        expect(await nebulaProxy.getAppendedVersion()).to.equal('0000000000000000000000000000000000000000000000000000000000000002');
      });

      it('properly records extendedcalldata', async () => {
        const tx = await nebulaProxy.recordCalldata();
        await tx.wait();

        const recordedCalldata = await nebulaProxy.getRecordedCalldata();
        const recordedSelector = recordedCalldata.substr(2, 10);
        const recordedVersion = recordedCalldata.substr(11, recordedCalldata.length);

        expect(recordedSelector).to.equal('7c79c26f');
        expect(recordedVersion).to.equal('0000000000000000000000000000000000000000000000000000000000000002');
      });
    });
  });
});
