# AWS Kiro Prompt

- [Designing Programs with Kiro](#designing-programs-with-kiro)
- [Original Prompt to Kiro](#original-prompt-to-kiro)
- [Kiro Response](#kiro-response)
- [Refinement](#refinement)
- [Conclusion](#conclusion)
    - [Steering](#steering)
    - [Kiro Feature Requests](#kiro-feature-requests)

## Designing Programs with Kiro

*How did I start?*
- I asked AI for ideas for award winning entries for the Code with Kiro Hackathon. It had several ideas.
- The Refactoring example for the Education category seemed interesting but a bit boring,  but made me think about AI refactoring _monstrously complex code_.
- On the spot, I came up with *HydraBug* and the *Complexasaur* Kaiju as Coding Katas.
Thus was born a (hopefully) award winning, entertaining Hackathon entry.

## Original Prompt to Kiro

> Create award-winning (in Kiro Hackathon), entertaining education app called "Kiro Kaiji: Refactor Rampage". It is a mobile-friendly website that allows you to enter a programming langage and (optionally) front-end framework and programming category, and difficulty level. It creates a challenge which will test the users refactoring and new feature development skills. Bonus points if they can overcome a monsterously bad coding challenge. Example Kaiju:
> 
> HydraBug -- fixing one bug will cause two new bugs if you are not careful.
> 
> Complexasaur -- code so complex it make you feel like you are being stomped by dinosaurs.
> 
> Come up with a few more Kaiju.
> 
> User can use Kiro AI to help refactor the code, create unit tests, and implement the new requirements.
> 
> When they submit the code, it is judged on code readability, code quality, lack of defects, and solving the requirements.
> 
> Use can also choose to "Zoom-a-Friend" and ask a question, which will get Pull Request advice from Quality Assurance, an Architect,  Product Owner, or Senior Software Developer. 
> 
> Use standard Google Meet Filter Characters (avatars) such as: Pig, Owl, Alien, Pufferfish, Bunny, Robot, Dinosaur, Dog, or Cat. Choose which Avatar would be funniest with each Role, such as Pufferfish for Quality Assurance. Create fake dialog for each role which is mostly mumbling, barking, meowing, etc with a few key words such as "Defect" and "Bug" for Quality Assurance and "Architecture" and "Redundancy" for the Architect.

## Kiro Response

**This sounds like an amazing and creative project!** Let me start by creating a spec for "Kiro Kaiji: Refactor Rampage" - this educational coding game concept has great potential.

Created [requirements.md](https://github.com/josher19/kiro-kaiju/blob/d2fa4be14af38824079086d59d030f889ca0e425/.kiro/specs/kiro-kaiji-refactor-rampage/requirements.md)

I've created an initial requirements document for "Kiro Kaiji: Refactor Rampage" based on your creative concept! The requirements cover:

- Challenge selection with language/framework/difficulty options
- Five different Kaiju monsters representing coding anti-patterns:

    - **HydraBug** - fixing bugs creates new bugs
    - **Complexasaur** - overly complex code
    - **Duplicatron** - massive code duplication
    - **Spaghettizilla** - tangled dependencies
    - **Memoryleak-odactyl** - memory management issues
- Kiro AI integration for refactoring help
- "Zoom-a-Friend" feature with animal avatars:
    - Pufferfish (QA) - puffs up when mad about bugs
    - Owl (Architect) - wise architectural advice
    - Pig (Product Owner) - requirements focus
    - Cat (Senior Developer) - coding best practices
- Automated evaluation system
- Mobile-friendly responsive design
- Progress tracking and achievements

## Refinement

> For call a Zoomie-Friend requirment, the user can select the icon for the animal with a title underneath. I will provide an image with all the animals when you need it. That can be done in requirements or Design.

Perfect! I'll update the requirements to clarify the Zoom-a-Friend interface with animal icons and titles.

Accepted edits to requirements.md

Great! I've updated the requirements to clarify that users will select animal icons with role titles underneath for the Zoom-a-Friend feature.

...

### Do the requirements look good? If so, we can move on to the design.

> No, open Steering Docs instead. I want to use Vue instead of React

...

Created [design.md](https://github.com/josher19/kiro-kaiju/blob/d2fa4be14af38824079086d59d030f889ca0e425/.kiro/specs/kiro-kaiji-refactor-rampage/design.md)

### Does the design look good? If so, we can move on to the implementation plan.

> Do not use Netlify. Options are local usage which will use Kiro to modify the file locally, which can then be submitted to the locally running app, or it will use AWS Services with an OpenRouter key for AI.

...

Created [tasks.md](https://github.com/josher19/kiro-kaiju/blob/d2fa4be14af38824079086d59d030f889ca0e425/.kiro/specs/kiro-kaiji-refactor-rampage/tasks.md)

### Do the tasks look good?

✅ Tasks - 16 actionable implementation tasks with clear coding objectives

The spec captures your creative vision of:

- Kaiju monsters representing coding anti-patterns (HydraBug, Complexasaur, Duplicatron, Spaghettizilla, Memoryleak-odactyl)
- Zoom-a-Friend feature with animal avatars giving role-specific advice
- Mobile-responsive design for coding on any device
- AI integration with Kiro or OpenRouter for learning assistance
- Gamified progression with achievements and difficulty unlocking

You can now begin executing tasks by opening the tasks.md file and clicking "Start task" next to any task item. I'd recommend starting with Task 1 to set up the project foundation, then working through them sequentially for the best development experience.

**The spec is ready to help you build this award-winning hackathon project! 🎮👾**

---
---

## Conclusion

There were further refinements, as you can see from the [git log](https://github.com/josher19/kiro-kaiju/commits).

Programming with Kiro was definitely a **force multiplier**. I'm a backend developer, but I could simply specify the UI I wanted and Kiro would create it.

It still needed guidance -- for example, it didn't know it should go directly to the Code Editor area as soon as the user had requested a Challenge. But it took **programming to a higher level**, so I could think more about *system design, architecture, and usability* rather than details such as how the VUE components should be laid out on the screen. 

When working on this project, I thought more about creativity and ease-of-use and less about technical details, and I'm usually a very detail-oriented person.

### Steering

I guided Kiro towards writing **Git Commits** by adding a Kiro steering file called [git-commits.md](https://github.com/josher19/kiro-kaiju/blob/main/.kiro/steering/git-commits.md).
- In this case, adding more detail to the steering file produced overly long commit messages, so I reverted to the original version of the file. 
- The [tech.md](.kiro/steering/tech.md) steering file was also useful in making sure Kiro used Vue v3 rather than React.

### Kiro Feature Requests:

- [Export or Copy Chat as Markdown](https://github.com/kirodotdev/Kiro/issues/2362) (rather than just plain text)
- [Tell Kiro about code Bugs / Defects](https://github.com/kirodotdev/Kiro/issues/2373) (rather than through Refinement or manually adding to Tasks)

_Next Step_: [Run Locally](https://github.com/josher19/kiro-kaiju/blob/main/kiro-kaiji-refactor-rampage/README.md) or _Play Online_
