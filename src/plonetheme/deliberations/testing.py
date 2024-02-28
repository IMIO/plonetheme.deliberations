# -*- coding: utf-8 -*-
from plone.app.robotframework.testing import REMOTE_LIBRARY_BUNDLE_FIXTURE
from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PLONE_FIXTURE
from plone.app.testing import PloneSandboxLayer
from plone.testing import z2

import plonetheme.deliberations


class PlonethemeDeliberationsLayer(PloneSandboxLayer):

    defaultBases = (PLONE_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        # Load any other ZCML that is required for your tests.
        # The z3c.autoinclude feature is disabled in the Plone fixture base
        # layer.
        import plone.app.dexterity
        self.loadZCML(package=plone.app.dexterity)
        import plone.restapi
        self.loadZCML(package=plone.restapi)
        self.loadZCML(package=plonetheme.deliberations)

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'plonetheme.deliberations:default')


PLONETHEME_DELIBERATIONS_FIXTURE = PlonethemeDeliberationsLayer()


PLONETHEME_DELIBERATIONS_INTEGRATION_TESTING = IntegrationTesting(
    bases=(PLONETHEME_DELIBERATIONS_FIXTURE,),
    name='PlonethemeDeliberationsLayer:IntegrationTesting',
)


PLONETHEME_DELIBERATIONS_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(PLONETHEME_DELIBERATIONS_FIXTURE,),
    name='PlonethemeDeliberationsLayer:FunctionalTesting',
)


PLONETHEME_DELIBERATIONS_ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(
        PLONETHEME_DELIBERATIONS_FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        z2.ZSERVER_FIXTURE,
    ),
    name='PlonethemeDeliberationsLayer:AcceptanceTesting',
)
