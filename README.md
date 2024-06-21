# QCBot
A Discord application to help manage voice model submissions in the AI HUB server.

![qcbot_aero_github_banner](https://github.com/Antasma245/QCBot/assets/144015963/0e7779da-9691-4de2-b22a-aa2872405eba)

## Workflow for submissions

Here's a simplified explanation of how the submissions review process works:

```mermaid
graph LR;

startProcess((Start)) ---> submit[//submit/] ---> check[//check/] & checkplus[//checkplus/] ---> approve[//approve/] & reject[//reject/];
approve ---> role[Role] ---> endProcess((End));
reject ---> endProcess;

subgraph 1;
submit;
end;

subgraph 2;
check & checkplus;
end;

subgraph 3;
approve & reject;
end;

subgraph 4;
role;
end;
```

1. An applicant creates a submission.
2. A controller retrieves the submission.
3. The submission is reviewed by the controller.
4. If approved, a special role is granted to the applicant.

## Resources

Want to know how to use the bot in your own server or what its commands are? **Check out [QCBot's official wiki](https://github.com/Antasma245/QCBot/wiki)!**

## Special thanks
[@RayTracerGC](https://github.com/RayTracerGC)

[@Eddycrack864](https://github.com/Eddycrack864)

[@SleepyYui](https://github.com/SleepyYui)

[@AIHubCentral](https://github.com/AIHubCentral)
