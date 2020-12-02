const { expect } = require('chai');

describe('Synthetix v3', function() {
  let beacon;

  const nebulaModuleId = ethers.utils.formatBytes32String('nebula');
  let nebulaProxy, nebulaImplementation;

  const pulsarModuleId = ethers.utils.formatBytes32String('pulsar');
  let pulsarProxy, pulsarImplementation;

  const cratioSettingId = ethers.utils.formatBytes32String('cratio');

  // ----------------------------------------
  // Version 1
  // ----------------------------------------

  describe('when deploying version 1', () => {
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
      let tx;

      // Upgrade contracts
      tx = await beacon.upgrade(
        [nebulaModuleId, pulsarModuleId],
        [nebulaImplementation.address, pulsarImplementation.address]
      );
      await tx.wait();

      // Configure settings
      tx = await beacon.configure(
        [cratioSettingId],
        [ethers.utils.formatBytes32String('600')]
      );
      await tx.wait();
    });

    before('initialize newly created proxies', async () => {
      let proxyAddress = await beacon.getProxy(nebulaModuleId);
      nebulaProxy = await ethers.getContractAt(
        'NebulaV1',
        proxyAddress
      );

      proxyAddress = await beacon.getProxy(pulsarModuleId);
      pulsarProxy = await ethers.getContractAt(
        'PulsarV1',
        proxyAddress
      );

      let tx = await nebulaProxy.setBeacon(beacon.address);
      await tx.wait();

      tx = await pulsarProxy.setBeacon(beacon.address);
      await tx.wait();
    });

    it('retrieves the correct versions from the beacon', async () => {
      expect(await beacon.getContractsVersion()).to.equal('1');
      expect(await beacon.getSettingsVersion()).to.equal('1');
    });

    it('properly forwards to the implementations', async () => {
      expect(await nebulaProxy.whoami()).to.equal('NebulaV1');
      expect(await pulsarProxy.whoami()).to.equal('PulsarV1');
    });

    it('retrieves settings correctly', async () => {
      expect(await beacon.getSetting(cratioSettingId)).to.equal(ethers.utils.formatBytes32String('600'));
    });

    // ----------------------------------------
    // Configure version 1
    // ----------------------------------------

    describe('when configuring version 1', () => {
      before('change settings', async () => {
        tx = await beacon.configure(
          [cratioSettingId],
          [ethers.utils.formatBytes32String('500')]
        );
        await tx.wait();
      });

      it('retrieves the correct versions from the beacon', async () => {
        expect(await beacon.getContractsVersion()).to.equal('1');
        expect(await beacon.getSettingsVersion()).to.equal('2');
      });

      it('retrieves settings correctly', async () => {
        expect(await beacon.getSetting(cratioSettingId)).to.equal(ethers.utils.formatBytes32String('500'));
      });

      // ----------------------------------------
      // Version 2
      // ----------------------------------------

      describe('when upgrading the system to version 2', () => {
        before('deploy implementations', async () => {
          const Nebula = await ethers.getContractFactory('NebulaV2');
          nebulaImplementation = await Nebula.deploy();

          await nebulaImplementation.deployed();
        });

        before('upgrade the beacon to version 2', async () => {
          const tx = await beacon.upgrade(
            [nebulaModuleId],
            [nebulaImplementation.address]
          );
          await tx.wait();

          const proxyAddress = await beacon.getProxy(nebulaModuleId);
          nebulaProxy = await ethers.getContractAt(
            'NebulaV2',
            proxyAddress
          );
        });

        it('retrieves the correct versions from the beacon', async () => {
          expect(await beacon.getContractsVersion()).to.equal('2');
          expect(await beacon.getSettingsVersion()).to.equal('2');
        });

        it('properly forwards to the implementations', async () => {
          expect(await nebulaProxy.whoami()).to.equal('NebulaV2');
          expect(await pulsarProxy.whoami()).to.equal('PulsarV1');
        });

        it('enables modules to know about each other', async () => {
          expect(await nebulaProxy.whoispulsar(), 'PulsarV1');
        });

        it('enables modules to know about settings', async () => {
          expect(await nebulaProxy.getCRatio()).to.equal(ethers.utils.formatBytes32String('500'));
        });
      });
    });
  });
});
