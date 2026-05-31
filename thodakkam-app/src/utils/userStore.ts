export const userStore = {
  name: 'Student Name',
  profilePhoto: null as string | null,
  email: 'student@example.com',
  phone: '+91 9876543210'
};

export const updateGlobalUser = (user: any) => {
  if (user.name) userStore.name = user.name;
  if (user.profilePhoto !== undefined) userStore.profilePhoto = user.profilePhoto;
  if (user.email) userStore.email = user.email;
  if (user.phone) userStore.phone = user.phone;
};
