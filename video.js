    // Products page: the install video inside a "More details" section only
    // loads when that section is opened, so the page stays fast. Closing the
    // section removes the video again, which also stops it playing.
    (function () {
      document.querySelectorAll('.product-video[data-video-id]').forEach(box => {
        const details = box.closest('details');
        if (!details) return;
        const fallback = box.innerHTML;

        details.addEventListener('toggle', () => {
          if (details.open) {
            const frame = document.createElement('iframe');
            frame.src = 'https://www.youtube-nocookie.com/embed/' + box.dataset.videoId;
            frame.title = box.dataset.videoTitle;
            frame.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.allowFullscreen = true;
            box.replaceChildren(frame);
          } else {
            box.innerHTML = fallback;
          }
        });
      });
    })();
