import i18n from '@/i18n';
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class UserService {
  private users: User[] = [];

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers(): void {
    this.users = [
      {
        id: 1,
        name: i18n.global.t('key_张三_615db57a'),
        email: 'zhangsan@example.com',
        role: 'admin',
      },
      {
        id: 2,
        name: i18n.global.t('key_李四_36c94235'),
        email: 'lisi@example.com',
        role: 'user',
      },
      {
        id: 3,
        name: i18n.global.t('key_王五_3228f322'),
        email: 'wangwu@example.com',
        role: 'guest',
      },
    ];
  }

  public async createUser(
    userData: Omit<User, 'id'>
  ): Promise<ApiResponse<User>> {
    try {
      const newUser: User = {
        id: this.users.length + 1,
        ...userData,
      };

      this.users.push(newUser);

      return {
        success: true,
        message: i18n.global.t('key_用户创建成功_a7499d82'),
        data: newUser,
      };
    } catch (error) {
      return {
        success: false,
        message: i18n.global.t('key_用户创建失败请重试_27c3667a'),
      };
    }
  }

  public async getUserById(id: number): Promise<ApiResponse<User>> {
    const user = this.users.find((u) => u.id === id);

    if (!user) {
      return {
        success: false,
        message: i18n.global.t('key_用户不存在_489251bf'),
      };
    }

    return {
      success: true,
      message: i18n.global.t('key_获取用户信息成功_b92ac75a'),
      data: user,
    };
  }

  public async updateUser(
    id: number,
    updates: Partial<Omit<User, 'id'>>
  ): Promise<ApiResponse<User>> {
    const userIndex = this.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return {
        success: false,
        message: i18n.global.t('key_找不到指定用户_9faec22e'),
      };
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updates };

    return {
      success: true,
      message: i18n.global.t('key_用户信息更新成功_c941d2d8'),
      data: this.users[userIndex],
    };
  }

  public async deleteUser(id: number): Promise<ApiResponse<null>> {
    const userIndex = this.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return {
        success: false,
        message: i18n.global.t('key_用户不存在删除失败_27a03773'),
      };
    }

    this.users.splice(userIndex, 1);

    return {
      success: true,
      message: i18n.global.t('key_用户删除成功_9b86e725'),
    };
  }

  public validateUserRole(user: User, requiredRole: User['role']): boolean {
    const roleHierarchy = {
      guest: 0,
      user: 1,
      admin: 2,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      throw new Error(i18n.global.t('key_权限不足无法执行此操作_ac15485c'));
    }

    return true;
  }
}

export { User, ApiResponse, UserService };
