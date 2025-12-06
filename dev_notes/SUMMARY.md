Currently in the process of building the frontend for the following project:

1.  The ML Core (The Engine):
    *   What it is: Our refactored sd-scripts Python `library`.
    *   Its Job: To execute the actual training process.
    *   How it's configured: Through Hydra, using `dataclasses` for a type-safe schema and YAML files for the values. It knows nothing about the web UI.

2.  The Backend (Mission Control):
    *   What it is: A FastAPI web server.
    *   Its Job: To act as an orchestrator. It receives training requests from the frontend, creates the necessary config files, and queues the training job in a database. It does not run the training itself.
    *   Key Tech: Huey with a SQLite backend This gives us a professional-grade, persistent job queue without requiring any external dependencies like Redis.

3.  The GPU Worker (The Pilot):
    *   What it is: A separate, long-running Python process (`worker.py`).
    *   Its Job: This is the only process that touches the GPU. It continuously watches the queue database (`queue.db`), picks up new jobs, and executes the ML Core script with the specified configuration.

---

References for working on the ui, based on the previous ui, can be found in trainer_reference.txt

---

## Developer Guides
- [Node Creation Guide](./NODE_CREATION_GUIDE.md)
- [Physics & Interaction Guide](./PHYSICS_GUIDE.md)
- [Old UI Reference](./pyside_reference.txt)

---

# TODOs and Notes

- [x] Dropout section: network dropout, rank dropout, module dropout to network node, non algo specific
- [x] Enforce section titles instead of just subtitles per setting
- low prio Optimizer args order: maybe reorder them so entry fields go first and toggles last in training node
- Expansion animation doesn't invoke proper collision physics
- Timestep and other noise related stuff to training node
- Greyed out effect on keep tokens separator entry field
- Check why physics feel glued for nearby nodes when expanding
- If collision happens should force be also applied to the initiating node? (something to think about)
- Clip skip greyed out for sdxl
- Check why dropdowns are white for a brief moment before style applying instead from the start
- Think about how logging will work
- Permanent font scaling instead of intermittent updates that look blurry?
- minimap for canvas, legend for buttons and stuff (maybe the nav bar could be clicked or replaced to show them)
- Enforce canvas bounds so nodes physically can't move outside of them
- Tooltips (still need to think about how to query flags)
- panning goes from 240 fps to 100~ why?
- gradient accumulation toggle should not alter shown value