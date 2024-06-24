---
path: filling-the-gap-between-ui-and-smoke-tests
title: Filling the Gap Between UI and Smoke Tests
date: 2024-06-24T23:44:54.138Z
description: At FREENOW we have been investigating how to stabilize our
  releases. One of the missing pieces we have found are randomized tests that
  can replicate almost any state in our app.
---
With every FREENOW app release, we aim to create an increment that "just works™" for our drivers, and any crashes, especially those requiring a hotfix, should be promptly detected and resolved in the development lifecycle.

Until now, we’ve relied on a combination of unit, UI, and smoke tests. However, over time, we’ve discovered that this leaves too many loopholes and we ended 2023 with a 30% Change Failure Rate[^1]. Comparing this with the rate that iOS had in the same year, it can be assumed that Android is more prone to this. Let’s see why.

## Android's Achilles Heels

Despite benefitting from Kotlin's language features and running Android Lint, our Android app is still prone to crashes.

Why? Here are a few reasons:

- Unsatisfied dependencies: Though Dagger2 is a *"static, compile time dependency injection framework"*[^2], this doesn't mean it can't break at runtime. The fact that Android owns the creation of `Activities` and `Fragments` leaves this to chance.
- Interoperability between Kotlin and Java: `NullPointerException` errors can sneak in when using Java types in Kotlin.[^3]
- Removed classes: The code shrinking tool `R8` can become a dangerous companion if it decides to remove code before compiling your release.
- Android’s own building blocks: `Activity/Fragment` life cycles can be difficult to handle, making it difficult to reproduce `IllegalStateException` errors.

These examples show that causes vary widely and only occur during runtime, making it impossible to handle them with traditional unit or integration tests. So, what other options do we have?
## Mitigation

We could try to visit all paths in our app as part of our weekly smoke test, but this wouldn’t scale. Here’s why:

- Our app is highly stateful: Many user flows depend on information the app receives from the backend. A tester would need to recreate those states by making many different bookings.
- We have plenty of feature flag combinations: Functionality depends on flags set for different markets or A/B tests. Trying out all combinations is not feasible.

Both issues mean that doing this manually would significantly increase everyone’s workload, and so there needs to be a better solution than that.
We have **four** requirements for a mostly automated solution, if we don’t go the manual way:

1. Little human involvement
2. Cover all possible interactions/paths 
3. Check with the latest (minified!) build
4. Inform before the release about a new crash

### Drafting A Solution

Based on the first requirement, we need to use a type of robot that imitates user interactions, for example, [UiAutomator2](https://github.com/appium/appium-uiautomator2-driver).

Regarding the second requirement, we’d inevitably run into an issue if we attempted to cover all interactions/paths within any of our environments. This is because we depend heavily on state information from our backend, and we can’t reflect this variety in our staging environment. Luckily, we have the OpenAPI definition at our disposal, which we can feed to a mock server and generate return values for the client. By incorporating randomized user interactions, we can cover most, if not all, user paths in the app.

To ensure we always have the latest build for testing, we create a new build from `develop` every 3 hours `*.apk`. As we’re only interested in crashes at this stage, we can use a crash-reporting tool,  such as Firebase Crashlytics, to inform us about new crashes.

![](static/images/uploads/pasted-image-20231229194010.png)

### Setting it up

With the solution drafted, we set up the necessary components on a Linux machine with VT-x[^5] support. Virtualization support is vital for the emulators to run smoothly.

For the mock server, we use the open-source tool [Imposter](https://www.imposter.sh/). It supports OpenAPI without complicated configuration, and responses can be further customized with scripts written in Groovy/Java. This is vital for us to correctly randomise feature flags or change booking states. With the endpoints ready, we can set up the Android emulators.

Starting multiple emulators is done with the help of a simple Python script. We use the provided docker images by [budtmo](https://github.com/budtmo/docker-android) here because they also come with Appium integration.

```python
import time

import subprocess
  

for i in range(0, 3):

...
	subprocess.call(['docker', 
	'run', 
	'-d',
	'-p', 
	f'608{i}:6080', 
	'-p' ,
	f'472{i}:4723' ,
	'--add-host=host.docker.internal:host-gateway', 
	'-e', 'EMULATOR_DEVICE=Samsung Galaxy S8',
	'-e', 'WEB_VNC=true', 
	'-e' ,'APPIUM=true', 
	'--device','/dev/kvm',
	'-v',
	'/home/mytaxi:/home/androidusr/test',
	'--name',
	f'android-container-{i}' ,
	'budtmo/docker-android:emulator_13.0'])
...
```

The only part missing is now the actual interaction with the app. Again, we are utilizing Python to get a quick version running. As the code snippet shows, no magic AI drives the interaction, we are just walking down the path by clicking on random elements. If we reach a dead end, we go back.

```python
import unittest

import random


class TestAppium(unittest.TestCase):

...

def test_app(self) -> None:
    elements = self.driver.find_elements(
             by=AppiumBy.XPATH, value="//*[@clickable='true']")
    if len(elements) == 0:
	    print("Nothing to click")
	    self.driver.press_keycode(4)
    else:
	    random_button = random.choice(elements)
	    
    try:
		print(f"Clicking on {random_button.text}")
		random_button.click()
		self.driver.implicitly_wait(500)
    except:
		print("Failed clicking")

...
```

### Conclusion

Now, let's be clear, this isn’t the ‘holy grail’ solution for catching all bugs before a release, nor is it a replacement for any parts of the quality process currently in place. But, running this kind of chaotic/fuzzy tool on your application is key to ensuring quality in mobile development, which we’d been widely overlooking.

We’ve been running this setup at FREENOW for the past six months, on three "dockerized" Android devices throughout the whole day, to cover almost all scenarios.

Here’s some important things we learned:  

- Initially, we didn't have a mechanism to update the OpenAPI specs for the mock server once they’d changed. A quick Python script solved this.
- This setup only partially isolates the app, making crash reports challenging to interpret because it’s unclear how to reproduce them. In the future, we'll need to reduce the dependency on third-party tool(s) here.
- We don't have an exact number of hotfixes this setup avoided, but we believe it prevented 1-2 hotfixes over the last six months.

We’ve already seen a certain payoff from running this for a few months; the maintenance is relatively low since the updated OpenAPI specs are pulled in automatically. Features that are relatively complex in terms of their API responses still require customization from the engineers to make them work (and not let the crawler end up with an error screen).

We hope that with this article we can spark more advances in the Android testing space.

*Thanks to Manuel Alfonso and Marcin Religa for proofreading this, my first blog post.And special thanks to Gabi Moreno and Usman Siddiqui, who’ve been working with me on this project.*

---

[^1]: https://codeclimate.com/blog/change-failure-rate 
[^2]: https://dagger.dev/
[^3]: https://kotlinlang.org/docs/java-interop.html#null-safety-and-platform-types
[^4]: Droid asset by [Nicky Lim](https://icon-icons.com/users/ah334sOoBVVE7GXS94Who/icon-sets/ "Designer"); [CC 4.0](https://creativecommons.org/licenses/by/4.0/)
[^5]: https://en.wikipedia.org/wiki/X86_virtualization#Intel_virtualization_(VT-x)