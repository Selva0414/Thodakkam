const fs = require('fs');
let code = fs.readFileSync('src/app/saved-posts.tsx', 'utf8');

const replacement = `        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchPosts = async () => {
    try {
      if (!identifier) {
        setLoading(false);
        return;
      }
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
      const res = await fetch(\`\${baseUrl}/api/posts/saved/\${encodeURIComponent(identifier)}?type=\${role}\`);
      const data = await res.json();
      if (data.success) {
        const processedPosts = data.posts.map((post) => {
          let pImageUrl = post.imageUrl;
          if (pImageUrl) {
            try {
              const parsed = JSON.parse(pImageUrl);
              if (Array.isArray(parsed) && parsed.length > 0) pImageUrl = parsed[0];
            } catch(e){}
            if (pImageUrl && !pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
              const filename = pImageUrl.split(/[\\/\\\\]/).pop();
              pImageUrl = \`\${baseUrl}/uploads/\${filename}\`;
            }
          }
          let uPhoto = post.user?.profilePhoto;
          if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            const filename = uPhoto.split(/[\\/\\\\]/).pop();
            uPhoto = \`\${baseUrl}/uploads/\${filename}\`;
          }
          return { ...post, imageUrl: pImageUrl, user: post.user ? { ...post.user, profilePhoto: uPhoto } : null };
        });
        setPosts(processedPosts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );`;

code = code.replace(/        toValue: 0,\r?\n    \}, \[\]\)\r?\n  \);/, replacement);
fs.writeFileSync('src/app/saved-posts.tsx', code);
