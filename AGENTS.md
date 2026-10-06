<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the managed TanStack Start entry points for the live preview; all desktop logic is browser-only React with no server functions, so later static export can reuse it.
- Separate desktop application metadata, window management, application content, and global styling; this keeps the phased OS recreation modular.
- Use original wallpaper art and locally drawn icons rather than bundled Ubuntu trademarks or unverified third-party assets.
