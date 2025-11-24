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

# TODOs and Notes

## Network Node Next Steps

-   **Dynamic Fields**: Implement logic to show/hide specific toggles and entry fields based on the selected "Network Algo" (e.g., different options for LoRA vs. LoHa).

-   ### List of options for each algorithm:

1. LoRA (Kohya)
    - lycoris preset disabled
    - conv dim and alpha disabled

2. LoCon (Kohya)
    - lycoris preset disabled

3. LoCon (LyCORIS)
    - Weight Decomposition (toggle)
    - WD on Output (toggle, connected to weight decomposition, so toggling this also toggles that)
    - Tucker Decomposition (toggle)
    - Orthogonalize (toggle)
    - Rank-Stabilized (toggle)
    - Train Norm (toggle)
    - Use Scalar (toggle)
    - Bypass Mode (toggle)

4. LoHA
    - Weight Decomposition (toggle)
    - WD on Output (toggle)
    - Tucker Decomposition (toggle)
    - Rank-Stabilized (toggle)
    - Train Norm (toggle)
    - Use Scalar (toggle)
    - Bypass Mode (toggle)

5. IA3
    - Train on Input (toggle)

6. LoKR
    - Factor (entry field)
    - Unbalanced Factorization (toggle)
    - Full Matrix (toggle)
    - Decompose both (toggle)
    - Weight Decomposition (toggle)
    - WD on Output (toggle)
    - Tucker Decomposition (toggle)
    - Orthogonalize (toggle)
    - Rank-Stabilized (toggle)
    - Train Norm (toggle)
    - Use Scalar (toggle)
    - Bypass Mode (toggle)

7. DyLoRA
    - DyLoRA Unit (entry field)
    - Train Norm (toggle)
    - Bypass Mode (toggle)

8. DIAG-OFT
    - Rescaled (toggle)
    - Constraint (toggle + entry field)
    - Train Norm (toggle)
    - Bypass Mode (toggle)

9. BOFT
    - Rescaled (toggle)
    - Constraint (toggle + entry field)
    - Train Norm (toggle)
    - Bypass Mode (toggle)

10. GLoRA
    - Tucker Decomposition (toggle)
    - Orthogonalize (toggle)
    - Rank-Stabilized (toggle)
    - Train Norm (toggle)
    - Use Scalar (toggle)
    - Bypass Mode (toggle)

11. GLoRA-Ex
    - Same as normal GLoRA

12. ABBA
    - Weight Decomposition (toggle)
    - WD on Output (toggle)
    - Train Norm (toggle)
    - Use Scalar (toggle)
    - Bypass Mode (toggle)

13. FULL
    - Train Norm (toggle)