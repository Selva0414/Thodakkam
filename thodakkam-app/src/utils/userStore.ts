export const userStore = {
  id: '' as string,
  name: '' as string,
  profilePhoto: null as string | null,
  email: '' as string,
  phone: '' as string
};

export const updateGlobalUser = (user: any) => {
  if (user.id) userStore.id = user.id;
  if (user.name) userStore.name = user.name;
  if (user.profilePhoto !== undefined) userStore.profilePhoto = user.profilePhoto;
  if (user.email) userStore.email = user.email;
  if (user.phone) userStore.phone = user.phone;
};
